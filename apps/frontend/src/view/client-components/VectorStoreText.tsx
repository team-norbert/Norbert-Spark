export const bodyText = `To create a vector store, please fill out the form with the necessary information about your documents, embedding model, vector embedding settings, and chat AI options. Once you submit the form, the provided data will be used to call the API endpoint to create your vector store. Make sure to review all fields and ensure that they are correctly filled out before submitting. You'll be able to use the created vector store for your AI applications, enabling you to perform tasks such as semantic search, question-answering, and more based on the documents you've uploaded. If you have any questions about the fields or need assistance, please refer to the documentation or contact support. You'll be to change these settings later if needed, so don't worry about getting everything perfect on the first try!`

export const vectorEmbeddingsText = `These settings control how your documents will be vectorised and stored in the vector
            store. The distance metric determines how similarity is calculated between vectors,
            while chunk size and overlap control how documents are split into smaller pieces for
            embedding. The recommended distance metric is usually "cosine", but it depends
            on your specific use case and the embedding model you choose. If you're unsure,
            check the documentation for your embedding model or experiment with different metrics to
            see which gives better results for your data. The chunk size and overlap settings can also have a significant impact on the quality of your embeddings and the performance of your vector store. It's important to experiment with these values to find the right balance for your specific use case and data characteristics. For now, the only choice permitted is "cosine", but we aim to allow other options in the future.`

export const chunkSizeText = `Chunk Size controls how large each text chunk will be when splitting
            documents for embedding. A smaller chunk size means more, smaller pieces, which can
            capture finer-grained information but may increase the number of vectors and thus
            storage and query costs. A larger chunk size means fewer, larger pieces, which can be
            more efficient but may lose some detail. The optimal chunk size depends on the typical
            length of your documents and the context window of your embedding model. A common
            starting point is around 500 tokens, but you may want to experiment with different sizes
            to see what works best for your data and use case. The minimum allowed is 1 token, and
            the maximum is 10,000 tokens, but you should experiment with different values to find
            the right balance for your application and to avoid excessively large chunks that could
            lead to loss of detail or excessively small chunks that could lead to increased costs.`

export const chunkOverlapText = `Chunk Overlap controls how much overlap there is between consecutive
            text chunks. Overlapping chunks can help preserve context across chunk boundaries, which
            can improve the quality of embeddings and downstream retrieval. However, too much
            overlap can increase the number of vectors and thus storage and query costs. A common
            setting is around 50 tokens, but you may want to experiment with different values to
            find the right balance for your data and use case. The minimum allowed is 0 (no overlap)
            and the maximum is 1000, but you should experiment with different values to find the
            right balance for your application and to avoid excessive overlap that could lead to
            increased costs without significant benefits.`

export const maxTokensText = `max tokens limits the length of the AI's generated response.
            Setting a lower value can help ensure concise answers, while a higher value allows for
            more detailed responses. The optimal setting depends on your use case and the typical
            length of responses you want to receive. The minimum allowed is 1 token, and the maximum
            is 100,000 tokens, but you should experiment with different values to find the right
            balance for your application and to avoid excessively long or short responses from the
            AI.`

export const temperatureText = `Temperature controls the randomness and creativity of the AI's
            responses. A value of 0 makes the output more deterministic and focused, while higher
            values (up to around 2) increase randomness and can lead to more creative or varied
            responses. The best setting depends on your specific use case and whether you prefer
            more consistent answers or a wider range of outputs. The minimum is 0, which will make
            the AI more deterministic, and the maximum is 2, which will make it more random, with
            step values of 0.1 in between. You should experiment with different values to find the
            right balance for your specific use case and the behaviour you want from the AI.`

export const topPText = `Top P is an alternative to temperature for controlling the randomness
            of the AI's responses. It uses nucleus sampling to consider only the most probable
            tokens whose cumulative probability exceeds the top P value. A lower top P (e.g., 0.1)
            means the AI will only consider the very top tokens, leading to more focused responses,
            while a higher top P (e.g., 0.9) allows for a wider range of tokens and more varied
            outputs. Experiment with different values to find the right balance for your use case.
            The minimum is 0 and the maximum is 1, with step values of 0.1 in between, but you should
            experiment with different values to find the right balance for your specific use case
            and the behaviour you want from the AI.`

export const frequencyPenaltyText = `Frequency Penalty reduces the likelihood of the AI repeating the same
            tokens in its response. A positive value (up to around 2) will penalise new tokens based
            on their existing frequency in the generated text, encouraging more varied language. A
            value of 0 means no penalty, while negative values can actually increase repetition.
            Adjust this setting if you find that the AI is being too repetitive or if you want to
            encourage more diversity in its responses. The minimum is -2, which can encourage
            repetition, and the maximum is 2, with step values of 0.1 in between, which can
            discourage it. The optimal value depends on your specific use case and how much
            repetition you want to allow in the AI's responses.`

export const presencePenaltyText = `Presence Penalty is similar to frequency penalty but instead of looking
            at the frequency of tokens, it penalises based on whether a token has already appeared
            in the generated text at all. A positive value (up to around 2) will encourage the AI to
            introduce new topics and concepts by penalising tokens that have already been mentioned,
            while a value of 0 means no penalty. Negative values can decrease the likelihood of
            introducing new topics. Use this setting if you want to encourage the AI to explore new
            ideas or if you find that it's sticking too closely to certain themes in its
            responses. The minimum is -2 and the maximum is 2, with steps values of 0.1 in between,
            but you should experiment with different values to find the right balance for your
            specific use case and the behaviour you want from the AI.`

export const stopSequencesText = `Stop Sequences are specific tokens or strings that, when generated by the AI, will signal it to stop generating any further text. This can be useful for controlling the format of the output or ensuring that the AI doesn't produce unwanted content beyond a certain point. You can enter multiple stop sequences separated by commas. For example, if you set a stop sequence of "\\n\\n", the AI will stop generating text once it produces two consecutive newline characters. Adjust this setting based on your specific use case and the desired format of the AI's responses. If nothing is entered then it will default to an empty array, meaning the AI will not have any specific stop sequences and will rely on other parameters (like max tokens) to determine when to stop generating text. An example entry could be: "END, STOP, \\n\\n" which would stop generation if the AI outputs "END", "STOP", or two newlines in a row.`

export const seedText = `Seed is a number that can be used to initialize the random number
            generator for the AI's response generation. Setting a specific seed value allows for
            reproducibility, meaning that if you use the same seed and the same parameters, you
            should get the same output from the AI. This can be useful for testing and debugging
            purposes, or if you want to generate consistent responses for certain inputs. If you
            leave this field blank, the AI will use a random seed each time, resulting in different
            outputs even with the same input and parameters.`

export const maxRetriesText = `Max Retries specifies the number of times the AI should attempt to
            generate a response if it fails or produces undesirable output. This can be useful for
            handling cases where the AI might produce an error or an output that doesn't meet
            certain criteria (e.g., too short, contains disallowed content, etc.). By setting a max
            retries value, you can allow the AI to try generating a response multiple times before
            giving up, which can improve the chances of getting a satisfactory answer. If you set
            this to 0, the AI will not retry and will return whatever output it generates on the
            first attempt. The optimal number of retries depends on your specific use case and how
            critical it is to get a good response. For some applications, you might want to allow
            several retries, while for others, you might prefer to keep it low to reduce latency.
            The maximum allowed is 10 to prevent excessively long response times, but you should
            experiment with different values to find the right balance for your application.`
