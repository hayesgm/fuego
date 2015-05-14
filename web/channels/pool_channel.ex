defmodule Fuego.PoolChannel do
  use Phoenix.Channel
  alias Fuego.Pool

  def join("pool:" <> pool, %{"client" => _client}, socket) do
    Mix.shell.error "Joining pool #{pool}..."
    if Pool.pool_exists?(pool) do
      Mix.shell.error("get mo'")
      reply = Pool.get_pool_chunk_peers(pool)
      Mix.shell.error("sending back... #{inspect reply}")
      {:ok, reply, socket}
    else
      Mix.shell.error("pool doesn't exist #{pool}")
      {:error, %{reason: "pool doesn't exist"}}
    end
  end

  def join("pool:" <> _, %{"pool" => pool, "description" => description, "chunks" => chunks, "peer" => peer}, socket) do
    if Pool.pool_exists?(pool) do
      Mix.shell.error "Pool exists..."
      {:ok, socket}
    else
      Mix.shell.error "Creating pool #{pool} for '#{description}' for peer #{peer}"
      Pool.register_pool(pool, peer, chunks, description)

      {:ok, socket}
    end
  end

  def handle_in("find_peer_for_chunk", %{"pool" => pool, "chunk" => chunk, "offer" => offer}, socket) do
    # peer = Pool.find_peer(pool, chunk)
    
    {:noreply, socket}
  end

  def handle_in("claim_chunk", %{pool: pool, chunk: chunk}, socket) do
    Pool.claim_peer_chunk(pool, chunk, socket)

    {:noreply, socket}
  end

  def terminate(_msg, socket) do
    # Pool.drop_peer(socket)

    {:noreply, socket}
  end

end