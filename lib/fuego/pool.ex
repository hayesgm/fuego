defmodule Fuego.Pool do

  # Registers a pool that can be retrieved.
  # pool should be a sha-256 sum of the value of the chunks
  # first seeder is responsible for finding peers for a given pool
  def register_pool(pool_id, peer_id, chunks, description) do
    true = is_sha256?(pool_id) # verify pool is sha256

    chunk_peers = Enum.reduce chunks, HashDict.new, fn chunk, dict ->
      # verify each chunk is sha-256
      true = is_sha256?(chunk)

      # Start with you as the host of everything
      Dict.put(dict, chunk, [peer_id])
    end

    peer_claims = Enum.map chunks, fn chunk ->
      {pool_id, chunk}
    end

    {:ok, pool_chunk_agent} = Agent.start_link fn -> chunk_peers end
    {:ok, claim_agent} = Agent.start_link fn -> peer_claims end

    :ets.insert(:pool_registry, {pool_id, [description: description, chunks: chunks, pool_chunk_agent: pool_chunk_agent]})
    :ets.insert(:claim_registry, {peer_id, claim_agent})
  end

  # Find a peer for a given chunk id in a pool
  def find_a_peer_for_chunk(pool_id, chunk) do
    {:ok, pool_chunk_agent} = get_pool_chunk_agent(pool_id)

    # Grab a random peer from a chunk
    Agent.get(pool_chunk_agent, fn dict -> 
      case Enum.shuffle(dict[chunk]) do
        [h|_] -> h
        [] -> nil
      end
    end)
  end

  def pool_exists?(pool_id) do
    case :ets.lookup(:pool_registry, pool_id) do
      [{^pool_id, _}] -> true
      [] -> false
    end
  end

  # Gets description and list of all chunks in a given pool
  def get_pool_chunk_agent(pool_id) do
    case :ets.lookup(:pool_registry, pool_id) do
      [{^pool_id, pool}] -> {:ok, pool[:pool_chunk_agent]}
      [] -> :error
    end
  end

  def get_pool(pool_id) do
    case :ets.lookup(:pool_registry, pool_id) do
      [{^pool_id, pool}] -> {:ok, pool}
      [] -> :error
    end
  end

  # Gets peer which contains active chunks
  def get_claim_agent_for_peer(peer_id) do
    case :ets.lookup(:claim_registry, peer_id) do
      [{^peer_id, claim_agent}] -> {:ok, claim_agent}
      [] -> {:error}
    end
  end

  # Gets or creates a new peer
  def get_or_create_claim_agent_for_peer(peer_id) do
    case get_claim_agent_for_peer(peer_id) do
      {:ok, claim_agent} -> {:ok, claim_agent}
      {:error} ->
        # Create a new agent...
        {:ok, claim_agent} = Agent.start_link fn -> [] end

        # ... and register it
        :ets.insert(:claim_registry, {peer_id, claim_agent})

        {:ok, claim_agent}
    end
  end

  def get_pool_chunks_with_peers(pool_id) do
    {:ok, pool} = get_pool(pool_id)

    pool_chunks = Agent.get(pool[:pool_chunk_agent], fn chunks -> chunks end)

    chunk_peers = Enum.map(pool_chunks, fn chunk_pair ->
      {chunk, peers} = chunk_pair

      case Enum.shuffle(peers) do
        [h|_] -> [chunk, h]
        [] -> nil
      end
    end)

    %{description: pool[:description], chunks: pool[:chunks], peers: chunk_peers}
  end

  # Registers a peer is willing to seed a given chunk of a pool
  def claim_chunk_by_peer(pool_id, chunk, peer_id) do
    {:ok, pool_chunk_agent} = get_pool_chunk_agent(pool_id)
    {:ok, claim_agent} = get_or_create_claim_agent_for_peer(peer_id)

    # Updates the given dict of chunks to append a peer for a given chunk
    Agent.update(pool_chunk_agent, fn dict ->
      peers = dict[chunk]
      Dict.put(dict, chunk, peers ++ [peer_id])
    end)

    Agent.update(claim_agent, fn list -> list ++ [{pool_id,chunk}] end)
  end

  def drop_chunk_from_peer(pool_id, chunk, peer_id) do
    {:ok, pool_chunk_agent} = get_pool_chunk_agent(pool_id)
    {:ok, claim_agent} = get_claim_agent_for_peer(peer_id)

    # Remove a given peer from a chunk
    Agent.update(pool_chunk_agent, fn dict ->
      Dict.put(dict, chunk, List.delete(dict[chunk], peer_id))
    end)

    Agent.update(claim_agent, fn list ->
      List.delete(list, {pool_id,chunk})
    end)
  end

  def drop_peer(peer_id) do
    {:ok, claim_agent} = get_claim_agent_for_peer(peer_id)

    # First, let's just clear the peer
    list = Agent.get(claim_agent, fn list -> list end)

    # and remove it from all chunks it was registered to
    Enum.each list, fn {pool_id, chunk} ->
      drop_chunk_from_peer(pool_id, chunk, peer_id)
    end

    # ensure the list is empty
    [] = Agent.get(claim_agent, fn list -> list end)

    Agent.stop(claim_agent)
    :ets.delete(:claim_registry, peer_id)
  end

  defp is_sha256?(hash) do
    if hash =~ ~r"[A-Fa-f0-9]{64}" do
      true
    else
      false
    end
  end

end