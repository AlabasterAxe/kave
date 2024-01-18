import { MergeStateFn, NodeState, TrimergeClient } from "trimerge-sync";
import { Project } from "kave-common";
import { createIndexedDbBackendFactory } from "trimerge-sync-indexed-db";
import { v4 as uuidv4, v5 as uuidv5 } from "uuid";
import { produce } from "immer";

import { Delta, DiffPatcher } from "jsondiffpatch";
import { selectProject } from "../store/store";
import { Action, Store } from "redux";

const UNDEFINED_PARENT = uuidv4();

function computeRef(
  baseRef: string | undefined,
  mergeRef: string | undefined,
  delta: Delta | undefined,
  editMetadata: string
): string {
  // TODO: do we need the mergeRef? if the baseRef is the same and the delta is the same
  // we consider this the same.
  return uuidv5(
    delta ? JSON.stringify(delta) : "",
    baseRef ?? UNDEFINED_PARENT
  );
}

export class Trimerger {
  readonly client: TrimergeClient<Project, string, Delta, {}>;

  constructor(private readonly diffPatcher: DiffPatcher) {
    this.client = new TrimergeClient(
      "foo",
      "bar",
      createIndexedDbBackendFactory("baz", { localIdGenerator: uuidv4 }),
      {
        computeRef,
        // we do this so that diff doesn't inherit "this" from the parent
        diff: (prior, current) => diffPatcher.diff(prior, current),
        patch: this.patch,
        merge: this.merge,
      },
      100
    );
  }

  private merge: MergeStateFn<Project, string> = (
    base,
    left,
    right
  ): NodeState<Project, string> => {
    // TODO: actually merge the projects
    return left;
  };

  private patch = (
    base: Project | undefined,
    delta: Delta | undefined
  ): Project => {
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
    if (newProject !== oldProject) {
      this.client.updateState(newProject, "new project");
    }
    return result;
  };
}
