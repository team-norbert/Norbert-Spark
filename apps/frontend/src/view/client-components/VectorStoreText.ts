export const bodyText = `To create a vector store, please fill out the form with the necessary information about your documents, embedding model, vector embedding settings, and chat AI options. Once you submit the form, the provided data will be used to call the API endpoint to create your vector store. Make sure to review all fields and ensure that they are correctly filled out before submitting. You'll be able to use the created vector store for your AI applications, enabling you to perform tasks such as semantic search, question-answering, and more based on the documents you've uploaded. If you have any questions about the fields or need assistance, please refer to the documentation or contact support. You'll be to change these settings later if needed, so don't worry about getting everything perfect on the first try!`

export const model = `<strong>Examples:</strong> text-embedding-3-small, text-embedding-3-large, etc. The
            dimension must match the model you choose, so check the documentation for your embedding
            model to find the correct dimension. Common dimensions are 384, 768, 1024, 1536, and
            3072, but it depends on the specific model you are using.`

export const maxTokens = `<strong>max tokens</strong> limits the length of the AI&#39;s generated
          response. Setting a lower value can help ensure concise answers, while a higher value
          allows for more detailed responses. The optimal setting depends on your use case and the
          typical length of responses you want to receive. The minimum allowed is 1 token, and the
          maximum is 100,000 tokens, but you should experiment with different values to find the
          right balance for your application and to avoid excessively long or short responses from
          the AI.`

export const Temperature = `<strong>Temperature</strong> controls the randomness and creativity of the AI&#39;s
            responses. A value of 0 makes the output more deterministic and focused, while higher
            values (up to around 2) increase randomness and can lead to more creative or varied
            responses. The best setting depends on your specific use case and whether you prefer
            more consistent answers or a wider range of outputs. The minimum is 0, which will make
            the AI more deterministic, and the maximum is 2, which will make it more random, with
            step values of 0.1 inbetween. You should experiment with different values to find the
            right balance for your specific use case and the behaviour you want from the AI.`

export const chunkOverlap = `<strong>Chunk Overlap</strong> controls how much overlap there is between consecutive
            text chunks. Overlapping chunks can help preserve context across chunk boundaries, which
            can improve the quality of embeddings and downstream retrieval. However, too much
            overlap can increase the number of vectors and thus storage and query costs. A common
            setting is around 50 tokens, but you may want to experiment with different values to
            find the right balance for your data and use case. The minimum allowed is 0 (no overlap)
            and the maximum is 1000, but you should experiment with different values to find the
            right balance for your application and to avoid excessive overlap that could lead to
            increased costs without significant benefits.`
