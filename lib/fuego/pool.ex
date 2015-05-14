defmodule Fuego.Pool do

  # Registers a pool that can be retrieved.
  # pool should be a sha-256 sum of the value of the chunks
  # first seeder is responsible for finding peers for a given pool
  def register_pool(pool, peer, chunks, description) do
    true = is_sha256?(pool) # verify pool is sha256

    peered_chunks = Enum.reduce chunks, HashDict.new, fn chunk, dict ->
      # verify each chunk is sha-256
      true = is_sha256?(chunk)

      Dict.put(dict, chunk, [peer])
    end

    pooled_chunks = Enum.map chunks, fn chunk ->
      {pool, chunk}
    end

    {:ok, pool_agent} = Agent.start_link fn -> peered_chunks end
    {:ok, peer_agent} = Agent.start_link fn -> pooled_chunks end

    :ets.insert(:pool_registry, {pool, [description: description, chunks: pool_agent]})
    :ets.insert(:peer_registry, {peer, peer_agent})
  end

  # Find a peer for a given chunk id in a pool
  def find_peer(pool, chunk) do
    {:ok, pool_agent} = get_pool_agent(pool)

    # Grab a random peer from a chunk
    Agent.get(pool_agent, fn dict -> 
      case Enum.shuffle(dict[chunk]) do
        [h|_] -> h
        [] -> nil
      end
    end)
  end

  def pool_exists?(pool) do
    case :ets.lookup(:pool_registry, pool) do
      [{^pool, _}] -> true
      [] -> false
    end
  end

  # Gets description and list of all chunks in a given pool
  def get_pool_agent(pool) do
    case :ets.lookup(:pool_registry, pool) do
      [{^pool, pool_info}] -> {:ok, pool_info[:chunks]}
      [] -> :error
    end
  end

  def get_pool_info(pool) do
    case :ets.lookup(:pool_registry, pool) do
      [{^pool, pool_info}] -> {:ok, pool_info}
      [] -> :error
    end
  end

  # Gets peer which contains active chunks
  def get_peer_agent(peer) do
    case :ets.lookup(:peer_registry, peer) do
      [{^peer, peer_agent}] -> {:ok, peer_agent}
      [] -> {:error}
    end
  end

  # Gets or creates a new peer
  def get_or_create_peer_agent(peer) do
    case get_peer_agent(peer) do
      {:ok, peer_agent} -> {:ok, peer_agent}
      {:error} ->
        # Create a new agent...
        {:ok, peer_agent} = Agent.start_link fn -> [] end

        # ... and register it
        :ets.insert(:peer_registry, {peer, peer_agent})

        {:ok, peer_agent}
    end
  end

  def get_pool_for_client(pool) do
    {:ok, pool_info} = get_pool_info(pool)

    chunks = Agent.get(pool_info[:chunks], fn chunks -> chunks end)

    %{description: pool_info[:description], chunks: Dict.keys(chunks)}
  end

  # Registers a peer is willing to seed a given chunk of a pool
  def claim_peer_chunk(pool, chunk, peer) do
    {:ok, pool_agent} = get_pool_agent(pool)
    {:ok, peer_agent} = get_or_create_peer_agent(peer)

    # Updates the given dict of chunks to append a peer for a given chunk
    Agent.update(pool_agent, fn dict ->
      peers = dict[chunk]
      Dict.put(dict, chunk, peers ++ [peer])
    end)

    Agent.update(peer_agent, fn list -> list ++ [{pool,chunk}] end)
  end

  def drop_peer_chunk(pool, chunk, peer) do
    {:ok, pool_agent} = get_pool_agent(pool)
    {:ok, peer_agent} = get_peer_agent(peer)

    # Remove a given peer from a chunk
    Agent.update(pool_agent, fn dict ->
      Dict.put(dict, chunk, List.delete(dict[chunk], peer))
    end)

    Agent.update(peer_agent, fn list ->
      List.delete(list, {pool,chunk})
    end)
  end

  def drop_peer(peer) do
    {:ok, peer_agent} = get_peer_agent(peer)

    # First, let's just clear the peer
    list = Agent.get(peer_agent, fn list -> list end)

    # and remove it from all chunks it was registered to
    Enum.each list, fn peer_chunk ->
      {pool, chunk} = peer_chunk

      drop_peer_chunk(pool, chunk, peer)
    end

    # ensure the list is empty
    [] = Agent.get(peer_agent, fn list -> list end)

    Agent.stop(peer_agent)
    :ets.delete(:peer_registry, peer)
  end

  defp is_sha256?(hash) do
    if hash =~ ~r"[A-Fa-f0-9]{64}" do
      true
    else
      false
    end
  end

end