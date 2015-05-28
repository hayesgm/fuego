defmodule Fuego.PoolChannel do
  use Phoenix.Channel
  alias Fuego.Pool

  def join("pool:" <> pool_id, %{"client" => _client, "peer_id" => peer_id}, socket) do
    Mix.shell.info "#{peer_id}: Joining pool #{pool_id}..."

    if Pool.pool_exists?(pool_id) do
      Mix.shell.info("#{peer_id}: Getting pool chunks with peers...")

      reply = Pool.get_pool_chunks_with_peers(pool_id)

      Mix.shell.info("#{peer_id}: Sending back... #{inspect reply}")

      {:ok, reply, %{socket| assigns: [peer_id: peer_id]}}
    else
      Mix.shell.info("#{peer_id}: Pool not found: #{pool_id}")

      {:error, %{reason: "pool not found"}}
    end
  end

  def join("pool:" <> _, %{"pool_id" => pool_id, "description" => description, "chunk_size" => chunk_size, "total_size" => total_size, "chunks" => chunks, "peer_id" => peer_id}, socket) do
    if Pool.pool_exists?(pool_id) do
      Mix.shell.info "#{peer_id}: Found pool #{pool_id}, claiming chunks..."

      Enum.each(chunks, fn chunk -> # note: failures here aren't caught by anyone...
        Pool.claim_chunk_by_peer(pool_id, chunk, peer_id)
      end)

      Mix.shell.info "#{peer_id}: chunks claimed..."

      {:ok, :found, %{socket| assigns: [peer_id: peer_id]}}
    else
      Mix.shell.info "#{peer_id}: Creating new pool #{pool_id} for '#{description}'"

      Pool.register_pool(pool_id, peer_id, chunks, description, chunk_size, total_size)

      {:ok, :created, %{socket| assigns: [peer_id: peer_id]}}
    end
  end

  def handle_in("find_a_peer_for_chunk", %{"pool_id" => pool_id, "chunk" => chunk, "but_please_not" => but_please_not}, socket) do
    Mix.shell.info "#{socket.assigns[:peer_id]}: Finding a peer for #{pool_id}::#{chunk}"
    remote_peer_id = Pool.find_a_peer_for_chunk(pool_id, chunk, but_please_not)

    {:reply, {:ok, %{peer_id: remote_peer_id}}, socket}
  end

  def handle_in("claim_chunk", %{"pool_id" => pool_id, "chunk" => chunk}, socket) do
    Pool.claim_chunk_by_peer(pool_id, chunk, socket.assigns[:peer_id])

    {:noreply, socket}
  end

  def handle_in("drop_chunk", %{"pool_id" => pool_id, "chunk" => chunk}, socket) do
    Pool.drop_chunk_from_peer(pool_id, chunk, socket.assigns[:peer_id])

    {:noreply, socket}
  end

  def terminate(_msg, socket) do
    Mix.shell.info "#{socket.assigns[:peer_id]}: Dropping peer..."

    Pool.drop_peer(socket.assigns[:peer_id]) # drop a peer by id

    {:noreply, socket}
  end

end