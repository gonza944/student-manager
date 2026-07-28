import os
import sys
from pathlib import Path

from graphify.build import build_from_json
from graphify.detect import detect
from graphify.export import to_json
from graphify.extract import extract


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    os.chdir(root)
    output = root / "graphify-out"
    output.mkdir(exist_ok=True)

    detection = detect(root)
    files = {
        kind: [path for path in paths if output not in Path(path).resolve().parents]
        for kind, paths in detection["files"].items()
    }
    extraction = extract(
        [Path(path) for path in files.get("code", [])],
        cache_root=root,
        parallel=False,
    )
    graph = build_from_json(extraction)

    to_json(graph, {}, str(output / "graph.json"), force=True, built_at_commit="")
    print(
        f"Code graph: {graph.number_of_nodes()} nodes, "
        f"{graph.number_of_edges()} relationships"
    )


if __name__ == "__main__":
    main()
