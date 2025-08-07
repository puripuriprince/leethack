
import asyncio
from llm.llm_handler import LLMHandler
from zep.zep_handler import ZepHandler
from tools.tool_handler import ToolHandler
from websearch.websearch_handler import WebSearchHandler
from sub_agents.sub_agent_handler import SubAgentHandler

class Agent:
    def __init__(self):
        self.llm_handler = LLMHandler()
        self.zep_handler = ZepHandler()
        self.tool_handler = ToolHandler()
        self.websearch_handler = WebSearchHandler()
        self.sub_agent_handler = SubAgentHandler()

    async def run(self, query):
        print(f"Agent received query: {query}")

        # 1. Get context from Zep
        context = await self.zep_handler.get_context(query)
        print(f"Zep context: {context}")

        # 2. Augment query with context
        augmented_query = f"{query}\n\nContext:\n{context}"

        # 3. Get response from LLM
        llm_response = await self.llm_handler.get_response(augmented_query)
        print(f"LLM response: {llm_response}")

        # 4. Determine if a tool should be used
        tool_to_use = self.tool_handler.determine_tool(llm_response)
        if tool_to_use:
            print(f"Using tool: {tool_to_use}")
            tool_result = await self.tool_handler.use_tool(tool_to_use, llm_response)
            print(f"Tool result: {tool_result}")
            # Potentially send tool_result back to LLM or Zep
            await self.zep_handler.add_memory(f"Tool used: {tool_to_use} with result: {tool_result}")
            final_response = tool_result
        else:
            final_response = llm_response
            await self.zep_handler.add_memory(f"LLM response to '{query}': {final_response}")


        # 5. Determine if a web search is needed
        if "search for" in llm_response.lower(): # simple keyword trigger
            search_query = llm_response.lower().split("search for")[-1].strip()
            print(f"Performing web search for: {search_query}")
            search_results = await self.websearch_handler.search(search_query)
            print(f"Web search results: {search_results}")
            final_response = search_results # or augment and send to LLM again
            await self.zep_handler.add_memory(f"Web search for '{search_query}' yielded: {search_results}")


        # 6. Determine if a sub-agent should be launched
        if "launch sub-agent" in llm_response.lower(): # simple keyword trigger
            print("Launching sub-agent...")
            sub_agent_result = await self.sub_agent_handler.launch_sub_agent(llm_response)
            print(f"Sub-agent result: {sub_agent_result}")
            final_response = sub_agent_result


        return final_response

async def main():
    agent = Agent()
    # Example usage:
    response = await agent.run("What is the capital of France and can you find me a local news article about it?")
    print(f"\nFinal Agent Response:\n{response}")

if __name__ == "__main__":
    asyncio.run(main()) 