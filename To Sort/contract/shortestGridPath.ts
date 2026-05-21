import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.ShortestPathInAGrid];

enum Direction {
  Down = "D",
  Right = "R",
  Up ="U",
  Left = "L"
};

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  const grid = ns.readPort(Ports.Contract) as Signature[0];
  var pathStr: Signature[1] = "", shortest: Signature[1] = "";
  var pathGrid = structuredClone(grid);
  var pos = [0, 0];

  function errUnreachable() {
    ns.alert("Error: shortestGridPath.ts executed code that should have been unreachable.");
    ns.exit();
  };

  function moveValid(y: number, x: number) {
    return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length && !grid[y][x] && !pathGrid[y][x];
  };

  function move(dir: Direction) {
    switch (dir) {
      case Direction.Down:
        pathGrid[pos[0]][pos[1]] = 1;
        ++pos[0];
        break;
      case Direction.Right:
        pathGrid[pos[0]][pos[1]] = 1;
        ++pos[1];
        break;
      case Direction.Up:
        pathGrid[pos[0]][pos[1]] = 1;
        --pos[0];
        break;
      case Direction.Left:
        pathGrid[pos[0]][pos[1]] = 1;
        --pos[1];
        break;
      default:
        errUnreachable();
        break;
    }
    pathStr += dir;
  };

  function backtrack() {
    let nextMove: Direction | undefined;

    while (!nextMove && pathStr) {
      switch (pathStr[pathStr.length - 1]) {
        case Direction.Down:
          --pos[0];
          if (moveValid(pos[0], pos[1] + 1))
            nextMove = Direction.Right;
          else if (moveValid(pos[0] - 1, pos[1]))
            nextMove = Direction.Up;
          else if (moveValid(pos[0], pos[1] - 1))
            nextMove = Direction.Left;
          break;
        case Direction.Right:
          --pos[1];
          if (moveValid(pos[0] - 1, pos[1]))
            nextMove = Direction.Up;
          else if (moveValid(pos[0], pos[1] - 1))
            nextMove = Direction.Left;
          break;
        case Direction.Up:
          ++pos[0];
          if (moveValid(pos[0], pos[1] - 1))
            nextMove = Direction.Left;
          break;
        case Direction.Left:
          ++pos[1];
          break;
        default:
          errUnreachable();
          break;
      }
      pathGrid[pos[0]][pos[1]] = 0;
      pathStr = pathStr.slice(0, pathStr.length - 1);
    }
    if (nextMove) {
      move(nextMove);
      return true;
    }
    return false;
  }

  for (let row of pathGrid)
    row.fill(0);

  while (!shortest || shortest.length > grid.length + grid[0].length - 2) {
    if (shortest && shortest.length <= pathStr.length) {
      if (!backtrack())
        break;
    }
    else if (pos[0] == grid.length - 1 && pos[1] == grid[0].length - 1) {
      shortest = structuredClone(pathStr);
      if (!backtrack())
        break;
    }
    else {
      if (moveValid(pos[0] + 1, pos[1]))
        move(Direction.Down);
      else if (moveValid(pos[0], pos[1] + 1))
        move(Direction.Right);
      else if (moveValid(pos[0] - 1, pos[1]))
        move(Direction.Up);
      else if (moveValid(pos[0], pos[1] - 1))
        move(Direction.Left);
      else if (!(pos[0] || pos[1]))
        break;
      else if (!backtrack())
        break;
    }
  }

  ns.writePort(Ports.Contract, shortest);
  ns.spawn("./attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}