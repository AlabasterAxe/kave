export interface RunRequest {
  events: any[];
  render: boolean;
  target: string;
  username?: string;
  password?: string;
  authTarget?: string;
  magnification?: number;
}
