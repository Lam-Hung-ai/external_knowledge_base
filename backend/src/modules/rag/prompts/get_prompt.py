def get_prompt(name: str):
    with open(f"./{name}.md") as file:
        content = file.read()
    return content
