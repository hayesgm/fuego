defmodule Fuego.PoolTest do
  use ExUnit.Case
  alias Fuego.Pool

  setup do
    pool_id = gen_sha
    peer_id = "1-1-1-1"
    chunks = [gen_sha, gen_sha]
    chunk_size = 100
    description = "my pool"
    total_size = 1234
    
    true = Pool.register_pool(pool_id, peer_id, chunks, description, chunk_size, total_size)

    {:ok, pool_id: pool_id, peer_id: peer_id, chunks: chunks, chunk_size: chunk_size, description: description, total_size: total_size}
  end

  test "#pool_exists?", %{pool_id: pool_id} do
    assert Pool.pool_exists?(pool_id) == true
    assert Pool.pool_exists?("haha") == false
  end

  test "#peer_exists?", %{peer_id: peer_id} do
    assert Pool.peer_exists?(peer_id) == true
    assert Pool.peer_exists?("haha") == false
  end

  test "#get_pool_chunks_with_peers", %{pool_id: pool_id, chunks: chunks} do
    res = Pool.get_pool_chunks_with_peers(pool_id)
    assert res[:description] == "my pool"
    Mix.shell.error inspect res
    assert Enum.sort(Enum.map(res[:peers], fn peer -> hd(peer) end)) == Enum.sort(chunks)
    assert Enum.map(res[:peers], fn peer -> hd(tl(peer)) end) == ["1-1-1-1", "1-1-1-1"]
  end

  test "#get_pool", %{pool_id: pool_id, peer_id: peer_id, description: description, chunks: chunks, chunk_size: chunk_size, total_size: total_size} do
    {:ok, pool} = Pool.get_pool(pool_id)

    assert pool[:description] == description
    assert pool[:chunk_size] == chunk_size
    assert pool[:total_size] == total_size

    found_chunks = pool[:chunks]
    assert found_chunks == chunks

    chunks_with_peers = Agent.get(pool[:pool_chunk_agent], fn list -> list end)

    assert Enum.sort(Dict.keys(chunks_with_peers)) == Enum.sort(chunks)
    assert Dict.values(chunks_with_peers) == [[peer_id], [peer_id]]
  end

  test "#find_a_peer_for_chunk", %{pool_id: pool_id, peer_id: peer_id, chunks: chunks} do
    found_peer = Pool.find_a_peer_for_chunk(pool_id, hd(chunks))

    assert found_peer == peer_id # the only peer
  end

  test "#find_a_peer_for_chunk with \"but_please_not\"", %{pool_id: pool_id, peer_id: peer_id, chunks: chunks} do
    Pool.claim_chunk_by_peer(pool_id, hd(chunks), "2-2-2-2")

    assert Pool.find_a_peer_for_chunk(pool_id, hd(chunks), ["2-2-2-2"]) == peer_id
    assert Pool.find_a_peer_for_chunk(pool_id, hd(chunks), [peer_id]) == "2-2-2-2"
    assert Pool.find_a_peer_for_chunk(pool_id, hd(chunks), [peer_id,"2-2-2-2"]) == nil
  end

  test "#drop_chunk_from_peer", %{pool_id: pool_id, peer_id: peer_id, chunks: chunks} do
    assert Pool.find_a_peer_for_chunk(pool_id, hd(chunks)) == peer_id

    Pool.drop_chunk_from_peer(pool_id, hd(chunks), peer_id)

    assert Pool.find_a_peer_for_chunk(pool_id, hd(chunks)) == nil
  end

  test "#claim_chunk_by_peer", %{pool_id: pool_id, peer_id: peer_id, chunks: chunks} do
    # Ensure we drop
    Pool.drop_chunk_from_peer(pool_id, hd(chunks), peer_id)
    assert Pool.find_a_peer_for_chunk(pool_id, hd(chunks)) == nil

    Pool.claim_chunk_by_peer(pool_id, hd(chunks), "2-2-2-2")
    assert Pool.find_a_peer_for_chunk(pool_id, hd(chunks)) == "2-2-2-2"
  end

  test "that claim_chunk_by_peer is idempotent", %{pool_id: pool_id, chunks: chunks} do
    chunk = hd(chunks)
    
    Pool.claim_chunk_by_peer(pool_id, chunk, "2-2-2-2")
    Pool.claim_chunk_by_peer(pool_id, chunk, "2-2-2-2")
    Pool.claim_chunk_by_peer(pool_id, chunk, "2-2-2-2")
    Pool.claim_chunk_by_peer(pool_id, chunk, "3-3-3-3")
    Pool.claim_chunk_by_peer(pool_id, chunk, "3-3-3-3")

    {:ok, pool_chunk_agent} = Pool.get_pool_chunk_agent(pool_id)
    peers = Agent.get(pool_chunk_agent, fn dict -> dict[chunk] end)

    assert peers == ["1-1-1-1","2-2-2-2","3-3-3-3"]
  end

  test "#drop_peer", %{pool_id: pool_id, peer_id: peer_id, chunks: chunks} do
    Pool.drop_peer(peer_id) # should remove peer from all pools

    assert Pool.find_a_peer_for_chunk(pool_id, hd(chunks)) == nil
  end

  defp gen_sha do
    rand_string = Hexate.encode(:crypto.rand_bytes(10))
    Hexate.encode(:crypto.hash(:sha256, rand_string))
  end

end