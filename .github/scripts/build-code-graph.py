import os
import sys
from pathlib import Path

from graphify.build import build_from_json
from graphify.detect import detect, save_manifest
from graphify.export import to_json
from graphify.extract import extract


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    os.chdir(root)
    output = root / "graphify-out"
    output.mkdir(exist_ok=True)

    detection = detect(root)
    extraction = extract(
        [Path(path) for path in detection["files"].get("code", [])],
        cache_root=root,
        parallel=False,
    )
    graph = build_from_json(extraction)

    to_json(graph, {}, str(output / "graph.json"), force=True, built_at_commit="")
    save_manifest(
        detection["files"],
        str(output / "manifest.json"),
        kind="ast",
        root=root,
    )

    print(
        f"Code graph: {graph.number_of_nodes()} nodes, "
        f"{graph.number_of_edges()} relationships"
    )


if __name__ == "__main__":
    main()
