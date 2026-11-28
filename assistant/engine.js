let generate;
self.onmessage = async ({data}) => {
  try {
    if (data.type === "load") {
const {env,pipeline} = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/dist/transformers.min.js");
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
      generate = await pipeline("text-generation", "onnx-community/Qwen2.5-0.5B-Instruct", {
        revision: "516c8d04add8a80c5228f32102b57953b8d421a9",
        device: "wasm", dtype: "q8",
        progress_callback: event => {
          if (event.status === "progress" && event.file.endsWith(".onnx") && Number.isFinite(event.progress))
            self.postMessage({type:"progress", percent: Math.floor(event.progress)});
        }
      });
      self.postMessage({type:"ready"});
    } else if (data.type === "ask" && generate) {
      const messages = [
        {role:"system", content:"You are SAUDI BYTE's games and software assistant. Answer briefly in " + (data.en ? "English" : "Arabic") + ". Ask for missing PC specs. Do not invent requirements, prices or links. The site's Games section has game search and PC checks. Its Software section has category filters."},
        {role:"user", content:data.question}
      ];
      const [result] = await generate(messages, {max_new_tokens:180, do_sample:false});
      const answer = result.generated_text.at(-1).content.trim();
      if (!answer) throw new Error("Empty answer");
      self.postMessage({type:"answer", answer});
    }
  } catch (error) { self.postMessage({type:"error", detail:String(error.message || error)}); }
};
