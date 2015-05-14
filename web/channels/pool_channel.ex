defmodule Fuego.PoolChannel do
  use Phoenix.Channel
  alias Fuego.Pool

  def join("pool:" <> pool, %{"client" => _client}, socket) do
    Mix.shell.error "Joining pool #{pool}..."
    if Pool.pool_exists?(pool) do
      Mix.shell.error("get mo'")
      reply = Pool.get_pool_for_client(pool)
      Mix.shell.error("sending back... #{inspect reply}")
      {:ok, reply, socket}
    else
      Mix.shell.error("pool doesn't exist #{pool}")
      {:error, %{reason: "pool doesn't exist"}}
    end
  end

  def join("pool:" <> _, %{"pool" => pool, "description" => description, "chunks" => chunks}, socket) do
    if Pool.pool_exists?(pool) do
      Mix.shell.error "Pool exists..."
      {:ok, socket}
    else
      Mix.shell.error "calling after join..."
      send(self, {:after_join, %{pool: pool, socket: socket, chunks: chunks, description: description}})
      {:ok, socket}
    end
  end

  def handle_info({:after_join, msg}, socket) do
    Mix.shell.error "Creating pool #{msg[:pool]} for '#{msg[:description]}' for socket #{inspect socket}"

    Pool.register_pool(msg[:pool], socket, msg[:chunks], msg[:description])

    {:noreply, socket}
  end

  def handle_in("find_peer_for_chunk", %{"pool" => pool, "chunk" => chunk, "offer" => offer}, socket) do
    peer = Pool.find_peer(pool, chunk)
    Mix.shell.error inspect peer
    push peer, "please_accept_offer", %{offer: offer}
    {:noreply, socket}
  end

  def handle_in("i_accept_offer", %{"offer" => offer, "answer" => answer}) do
    
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