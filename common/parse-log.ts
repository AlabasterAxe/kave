export function parseLog(log: String) {
  let lines = log.split("\n");
  return lines.map((line) => {
    let parts = line.split(" ");
    let timestampMillis = parseInt(parts[0]);
    let type = parts[1];
    return { timestampMillis, type };
  });
}
