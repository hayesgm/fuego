defmodule Fuego.PoolControllerTest do
  use Fuego.ConnCase
  use Fuego.PoolHelper
  alias Fuego.Pool

  setup do
    gen_pool
  end

  test "GET /api/pools/non-existant-pool-id" do
    conn = get conn(), "/api/pools/non-existant-pool-id"
    json_response(conn, 404)
  end

  test "GET /api/pools/pool-id", %{pool_id: pool_id} do

    conn = get conn(), "/api/pools/#{pool_id}"
    assert json_response(conn, 200)["pool_id"] == pool_id
  end

end
