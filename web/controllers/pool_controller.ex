defmodule Fuego.PoolController do
  alias Fuego.Pool
  use Fuego.Web, :controller

  def info(conn, %{"pool_id" => pool_id}) do
    case Pool.pool_exists?(pool_id) do
      true -> json(conn, pool_to_map(pool_id, Pool.get_pool_chunks_with_peers(pool_id)))
      false -> conn |> put_status(:not_found) |> json %{}
    end
  end

  defp pool_to_map(pool_id, pool) do
    %{
      "pool_id" => pool_id,
      "description" => pool[:description],
      "chunk_size" => pool[:chunk_size],
      "total_size" => pool[:total_size],
      "chunks" => pool[:chunks],
      "peers" => pool[:peers]
    }
  end

end
