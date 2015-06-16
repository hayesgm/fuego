defmodule Fuego.PoolHelper do

  defmacro __using__([]) do
    quote do
      def gen_pool(opts \\ %{}) do
        pool_id = opts[:pool_id] || gen_sha
        peer_id = opts[:peer_id] || "1-1-1-1"
        chunks = opts[:chunks] || [gen_sha, gen_sha]
        chunk_size = opts[:chunk_size] || 100
        description = opts[:description] || "my pool"
        total_size = opts[:total_size] || 1234
        
        true = Fuego.Pool.register_pool(pool_id, peer_id, chunks, description, chunk_size, total_size)

        {:ok, pool_id: pool_id, peer_id: peer_id, chunks: chunks, chunk_size: chunk_size, description: description, total_size: total_size}
      end

      defp gen_sha do
        rand_string = Hexate.encode(:crypto.rand_bytes(10))
        Hexate.encode(:crypto.hash(:sha256, rand_string))
      end
    end
  end
end