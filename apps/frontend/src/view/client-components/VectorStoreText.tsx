export const bodyText = `To create a vector store, fill out the form with information about your documents,
embedding model, vector settings, and chat AI options. When you submit the form, this information
will be used to call the API endpoint that creates and configures your vector store.

The resulting vector store can be used by your AI applications for tasks such as semantic search,
document retrieval, and question answering. These techniques are commonly used in
retrieval-augmented generation (RAG) systems.

Please review all fields carefully before submitting. Most settings can be changed later if needed,
so you don’t need to get everything perfect on the first attempt. If you need help understanding a
field, consult the documentation or contact support.`

export const vectorEmbeddingsText = `These settings control how your documents are converted into vectors and stored
in the vector store.

The distance metric determines how similarity between vectors is calculated.
Chunk size and chunk overlap determine how documents are split into smaller
segments before embeddings are generated.

Cosine similarity is commonly used with modern embedding models, particularly
when vectors are normalized. Other metrics such as dot product or L2 distance
may also be used depending on the system.

Chunking settings can significantly affect retrieval quality and storage size.
Experimenting with different values can help you find the best configuration for
your documents and use case.

Currently only "cosine" similarity is supported in this interface, though
additional options may be added in the future.`

export const chunkSizeText = `Chunk Size controls how large each piece of text will be when splitting
documents before generating embeddings.

Smaller chunks produce more vectors and can capture finer-grained information,
which may improve retrieval accuracy. However, they increase storage requirements
and query cost.

Larger chunks produce fewer vectors and are more efficient, but they may contain
multiple topics, which can reduce retrieval precision.

A common starting point is between 200 and 500 tokens, though the optimal value
depends on the structure of your documents and your retrieval requirements.

The minimum allowed value is 1 token and the maximum allowed by this interface
is 10,000 tokens. Extremely large chunks are usually not recommended because
they may reduce the precision of semantic search.
`

export const chunkOverlapText = `Chunk Overlap controls how much text is shared between consecutive chunks.

Adding overlap helps preserve context at chunk boundaries. This can improve
retrieval quality because important sentences are less likely to be split
between two chunks.

However, larger overlap values increase the total number of vectors stored,
which can increase storage and query costs.

A common starting value is around 20–50 tokens of overlap. The minimum allowed
value is 0 (no overlap), and the maximum allowed value is 1000 tokens.`

export const maxTokensText = `Max Tokens limits the maximum length of the AI model's generated response.

Lower values produce shorter and more concise responses, while higher values
allow longer and more detailed outputs.

The optimal setting depends on your use case and the AI model being used.
Different models support different maximum output lengths.

The maximum value allowed by this interface is 100,000 tokens, though the
actual usable limit depends on the model and provider.`

export const temperatureText = `Temperature controls the randomness of the AI model's responses.

Lower values (closer to 0) make the output more deterministic and focused,
while higher values increase randomness in token selection, which can lead
to more varied or creative responses.

Typical values range from 0 to 1. The minimum allowed value is 0 and the
maximum is 2, with step values of 0.1.

Experiment with different settings to find the behaviour that best fits
your application.`

export const topPText = `Top P controls randomness using a method called nucleus sampling.

Instead of considering all possible tokens, the model selects from the smallest
set of tokens whose cumulative probability exceeds the specified Top P value.

Lower values (for example 0.1) restrict the model to only the most probable
tokens, producing more focused and predictable responses. Higher values
(for example 0.9) allow a wider range of tokens and more varied output.

Top P typically ranges from 0 to 1. It is generally recommended to adjust
either temperature or Top P, but not both simultaneously.`

export const frequencyPenaltyText = `Frequency Penalty reduces the likelihood that the model will repeat
the same tokens multiple times in a response.

Positive values penalize tokens that have already appeared frequently in
the generated text, encouraging more varied wording. A value of 0 means no
penalty is applied.

Negative values can increase the chance of repetition.

The allowed range is from -2 to 2 with step values of 0.1. Not all models
support this parameter.`

export const presencePenaltyText = `Presence Penalty encourages the model to introduce new topics or
concepts during generation.

Unlike frequency penalty, which considers how often a token appears,
presence penalty only checks whether the token has appeared at all.

Positive values encourage the model to explore new topics. Negative
values can make the output stay closer to the existing context.

The allowed range is from -2 to 2 with step values of 0.1. Not all models
support this parameter.`

export const stopSequencesText = `Stop Sequences are specific strings that signal the AI model to stop
generating additional text when they appear.

This can be useful for controlling the structure of responses or preventing
the model from generating unwanted content beyond a certain point.

Multiple stop sequences can be provided as a comma-separated list. For example:

"END, STOP, \\n\\n"

If no value is provided, an empty list will be used and generation will stop
only when the model reaches its maximum token limit or the provider stops
generation automatically.`

export const seedText = `Seed is a number used to initialize the random sampling process
during text generation.

When a fixed seed is provided, the model may produce the same output
when given the same input and parameters. This can be useful for testing
or debugging.

If the field is left empty, a random seed will be used and results may
vary between requests.

Note that deterministic results depend on whether the underlying AI model
and provider support seeded sampling.`

export const maxRetriesText = `Max Retries specifies how many times the client should retry the
generation request if it fails.

Retries may occur due to temporary network issues, provider errors, or
other request failures.

Setting a retry value can improve reliability, but higher values may
increase response latency if repeated failures occur.

A value of 0 disables retries. The maximum allowed value is 10.`

export const taskTypes = (
  <>
    This is only required for a few different models provided by Google.
    <br />
    <br />
    It is recommended that you read the online documentation:{' '}
    <Link
      href="https://docs.cloud.google.com/vertex-ai/generative-ai/docs/embeddings/task-types"
      target="_blank"
      rel="noopener noreferrer"
    >
      Google Vertex AI embeddings task types documentation
    </Link>
    .
    <br />
    <br />
    If you are unsure, then pick <code>RETRIEVAL_QUERY</code>.
  </>
)
