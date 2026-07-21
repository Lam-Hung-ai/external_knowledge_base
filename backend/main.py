from langchain_text_splitters.character import RecursiveCharacterTextSplitter

with open("sample.txt") as f:
    data = f.read()

print(data)
splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", ".", " ", ""], chunk_size=500, chunk_overlap=50
)
# splitter = RecursiveCharacterTextSplitter(chunk_size=1024, chunk_overlap=100)
chunks = splitter.split_text(data)
print("-" * 10)
for i, chunk in enumerate(chunks):
    print(f"{i}: {chunk}")
