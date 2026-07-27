from modules.rag.reranker import ReRanker

rerank = ReRanker.from_environment()
rerank.rerank(
    query="What is the capital of France?",
    documents=[
        "The capital of France is Paris.",
        "France is a country in Europe.",
        "The Eiffel Tower is located in Paris.",
    ],
    top_n=2,
)
