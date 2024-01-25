import { CommitDoc, CoordinatingLocalStore, MergeDocFn, MergeResult, OnStoreEventFn, TrimergeClient, makeMergeAllBranchesFn } from "trimerge-sync";
import { Document } from "../../../../lib/common/dist";
import { IndexedDbCommitRepository } from "trimerge-sync-indexed-db";
import { v4 as uuidv4, v5 as uuidv5 } from "uuid";
import { produce } from "immer";

import { Delta, DiffPatcher } from "jsondiffpatch";
import { selectProject } from "../store/store";
import { Action, Store } from "redux";
import { ALL_PROJECTS, blankProject } from "../store/project";

const UNDEFINED_PARENT = uuidv4();

function computeRef(
  baseRef: string | undefined,
  mergeRef: string | undefined,
  delta: Delta | undefined,
): string {
  // TODO: do we need the mergeRef? if the baseRef is the same and the delta is the same
  // we consider this the same.
  return uuidv5(
    delta ? JSON.stringify(delta) : "",
    baseRef ?? UNDEFINED_PARENT
  );
}

function sortRefs(refA: string, refB: string): number {
  return refA.localeCompare(refB);
}

function getLocalStore(docId: string) {
  return (userId: string, clientId: string, onEvent: OnStoreEventFn<string, Delta, unknown>) => {
  const commitRepo = new IndexedDbCommitRepository<string, Delta, unknown>(docId, {
    remoteId: 'qux',
    localIdGenerator: () => uuidv4(),
  });
  return new CoordinatingLocalStore(userId, clientId, onEvent, commitRepo)
}}

export class Trimerger {
  private client: TrimergeClient<Document, Document, string, Delta, unknown> | undefined;
  private activeProjectId: string | undefined;
  private readyResolve: ((client: TrimergeClient<Document, Document, string, Delta, unknown>) => void) | undefined;
  private readyReject: ((error: Error) => void) | undefined;
  private readyPromise: Promise<TrimergeClient<Document, Document, string, Delta, unknown>> | undefined;
  private unsubscribeSyncStatus: (() => void) | undefined;
  private onNewDoc: ((doc: Document | undefined) => void) | undefined;

  constructor(private readonly diffPatcher: DiffPatcher) {}

  // TODO: handle the case where another setActiveProject call comes in before the first one is done
  async setActiveProject(projectId: string | undefined): Promise<TrimergeClient<Document, Document, string, Delta, unknown> | undefined> {
    if (projectId === this.activeProjectId) {
      return this.client ?? await this.readyPromise;
    }

    if (this.readyReject) {
      this.readyReject(new Error("new project set before old project was ready"));
      this.readyPromise = undefined;
      this.readyResolve = undefined;
      this.readyReject = undefined;
    }

    if (this.unsubscribeSyncStatus) {
      this.unsubscribeSyncStatus();
      this.unsubscribeSyncStatus = undefined;
    }

    if (this.client) {
      await this.client.shutdown();
    }

    if (!projectId) {
      this.client = undefined;
      this.activeProjectId = undefined;
      return;
    }

    const newClient = new TrimergeClient(
      "foo",
      "bar",
      {
        getLocalStore: getLocalStore(projectId),
        computeRef,
        // we do this so that diff doesn't inherit "this" from the parent
        differ: {
          diff: (prior: Document | undefined, current: Document) => this.diffPatcher.diff(prior, current),
          patch: this.patch,
        },
        mergeAllBranches: makeMergeAllBranchesFn(sortRefs, this.merge),
      },
    )

    

    this.readyPromise = new Promise<TrimergeClient<Document, Document, string, Delta, unknown>>((resolve, reject)=> {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    this.activeProjectId = projectId;

    let completed = false;
    this.unsubscribeSyncStatus = newClient.subscribeSyncStatus(value => {
      if (value.localRead === "ready" && !completed) {
        completed = true;
        this.client = newClient
        this.client.subscribeDoc((doc) => this.handleDocUpdate(doc));
        this.readyResolve?.(this.client);
        this.readyPromise = undefined;
        this.readyResolve = undefined;
        this.readyReject = undefined;
        this.unsubscribeSyncStatus?.();
        this.unsubscribeSyncStatus = undefined;
      }
    });
    return this.readyPromise;
  }
  
  private handleDocUpdate(doc: Document | undefined) {
    if (!this.onNewDoc) {
      return;
    }

    if (!doc) {
      for (const project of ALL_PROJECTS) {
        if (project.id === this.activeProjectId) {
          this.onNewDoc(project);
          return;
        }
      }
      this.onNewDoc(blankProject(this.activeProjectId!))
      return;
    }

    this.onNewDoc(doc);
  }

  subscribeDoc(onNewDoc: (doc: Document | undefined) => void) {
    this.onNewDoc = onNewDoc;
  }

  private merge: MergeDocFn<Document, string> = (
    base: CommitDoc<Document, string> | undefined,
    left: CommitDoc<Document, string>,
    right: CommitDoc<Document, string>,
  ): MergeResult<Document, string> => {
    // TODO: actually merge the projects
    return {
      doc: left.doc,
      temp: false,
      metadata: "merge",
    };
  };

  private patch = (
    base: Document | undefined,
    delta: Delta | undefined
  ): Document => {
    if (delta === undefined) {
      if (base === undefined) {
        throw new Error("one of base or delta must be defined");
      }
      return base;
    }
    const result = produce(base, (draft) =>
      this.diffPatcher.patch(draft, delta)
    );

    if (!result) {
      throw new Error("patch failed");
    }
    return result;
  };

  public middleware = (store: Store) => (next: any) => (action: Action) => {
    const oldProject = selectProject(store.getState());
    const result = next(action);
    const newProject = selectProject(store.getState());
    if (newProject && newProject !== oldProject) {
      this.client?.updateDoc(newProject, "new project");
    }
    return result;
  };
}
