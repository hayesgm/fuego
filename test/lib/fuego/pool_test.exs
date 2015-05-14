defmodule Fuego.PoolTest do
  use ExUnit.Case
  alias Fuego.Pool

  setup do
    pool = gen_sha
    peer = "1.1.1.1"
    chunks = [gen_sha, gen_sha]
    description = "my pool"
    
    true == Pool.register_pool(pool, peer, chunks, description)

    {:ok, pool: pool, peer: peer, chunks: chunks, description: description}
  end

  test "#pool_exists?", %{pool: pool} do
    assert Pool.pool_exists?(pool) == true
    assert Pool.pool_exists?("haha") == false
  end

  test "#get_pool_for_client", %{pool: pool, chunks: chunks} do
    assert Pool.get_pool_for_client(pool) == %{description: "my pool", chunks: [hd(chunks),hd(tl(chunks))]}
  end

  test "#find_pool", %{pool: pool, peer: peer, description: description, chunks: chunks} do
    {:ok, found_pool} = Pool.get_pool_info(pool)

    assert found_pool[:description] == description

    found_chunks = Agent.get(found_pool[:chunks], fn list -> list end)

    assert Enum.sort(Dict.keys(found_chunks)) == Enum.sort(chunks)
    assert Dict.values(found_chunks) == [[peer], [peer]]
  end

  test "#find_peer", %{pool: pool, peer: peer, chunks: chunks} do
    found_peer = Pool.find_peer(pool, hd(chunks))

    assert found_peer == peer
  end

  test "#drop_peer_chunk", %{pool: pool, peer: peer, chunks: chunks} do
    Pool.drop_peer_chunk(pool, hd(chunks), peer)

    assert Pool.find_peer(pool, hd(chunks)) == nil
  end

  test "#claim_peer_chunk", %{pool: pool, peer: peer, chunks: chunks} do
    Pool.drop_peer_chunk(pool, hd(chunks), peer)

    Pool.claim_peer_chunk(pool, hd(chunks), "2.2.2.2")

    assert Pool.find_peer(pool, hd(chunks)) == "2.2.2.2"
  end

  test "#drop_peer", %{pool: pool, peer: peer, chunks: chunks} do
    Pool.drop_peer(peer) # should remove peer from all pools

    assert Pool.find_peer(pool, hd(chunks)) == nil
  end

  defp gen_sha do
    rand_string = Hexate.encode(:crypto.rand_bytes(10))
    Hexate.encode(:crypto.hash(:sha256, rand_string))
  end

end