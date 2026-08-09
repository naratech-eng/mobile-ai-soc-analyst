"""Retrieve ATT&CK technique context for a normalized signal (step 2 of the
RAG pipeline in docs/engineering/system-design.md)."""

from dataclasses import dataclass

from app.rag.ingest import COLLECTION_NAME, get_client


@dataclass
class TechniqueMatch:
    attack_id: str
    name: str
    url: str
    text: str
    distance: float


def retrieve_technique_context(query: str, top_k: int = 3) -> list[TechniqueMatch]:
    client = get_client()
    collection = client.get_or_create_collection(COLLECTION_NAME)

    if collection.count() == 0:
        return []

    results = collection.query(query_texts=[query], n_results=min(top_k, collection.count()))

    matches: list[TechniqueMatch] = []
    ids = results["ids"][0]
    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    distances = results["distances"][0]

    for i in range(len(ids)):
        meta = metadatas[i]
        matches.append(
            TechniqueMatch(
                attack_id=meta["attack_id"],
                name=meta["name"],
                url=meta["url"],
                text=documents[i],
                distance=distances[i],
            )
        )
    return matches
