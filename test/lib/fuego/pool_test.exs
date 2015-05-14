defmodule Fuego.PoolTest do
  use ExUnit.Case
  alias Fuego.Pool

  setup do
    pool_id = gen_sha
    peer_id = "1-1-1-1"
    chunks = [gen_sha, gen_sha]
    description = "my pool"
    
    true == Pool.register_pool(pool_id, peer_id, chunks, description)

    {:ok, pool_id: pool_id, peer_id: peer_id, chunks: chunks, description: description}
  end

  test "#pool_exists?", %{pool_id: pool_id} do
    assert Pool.pool_exists?(pool_id) == true
    assert Pool.pool_exists?("haha") == false
  end

  test "#get_pool_chunks_with_peers", %{pool_id: pool_id, chunks: chunks} do
    res = Pool.get_pool_chunks_with_peers(pool_id)
    assert res[:description] == "my pool"
    Mix.shell.error inspect res
    assert Enum.sort(Enum.map(res[:peers], fn peer -> hd(peer) end)) == Enum.sort(chunks)
    assert Enum.map(res[:peers], fn peer -> hd(tl(peer)) end) == ["1-1-1-1", "1-1-1-1"]
  end

  test "#get_pool", %{pool_id: pool_id, peer_id: peer_id, description: description, chunks: chunks} do
    {:ok, pool} = Pool.get_pool(pool_id)

    assert pool[:description] == description

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

  test "#drop_peer", %{pool_id: pool_id, peer_id: peer_id, chunks: chunks} do
    Pool.drop_peer(peer_id) # should remove peer from all pools

    assert Pool.find_a_peer_for_chunk(pool_id, hd(chunks)) == nil
  end

  defp gen_sha do
    rand_string = Hexate.encode(:crypto.rand_bytes(10))
    Hexate.encode(:crypto.hash(:sha256, rand_string))
  end

end