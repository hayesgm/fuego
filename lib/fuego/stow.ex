defmodule Fuego.Stow do
  require Record
  Record.defrecord :cql_query, statement: nil, values: [], reusable: :undefined, named: false, page_size: 100, page_state: :undefined, consistency: 1, serial_consistency: :undefined, value_encode_handler: :undefined

  def put(:text, message, ttl \\ 2592000) do # 30 days
    tkn = Fuego.UUID.uuid1()

    query = cql_query(
      statement: """
      INSERT INTO notes (tkn, type, message)
        VALUES (:tkn, 'text', textAsBlob(:message))
        USING TTL :ttl
      """,
      values: [ tkn: Fuego.UUID.string_to_binary!(tkn), message: message, ttl: ttl ]
    )

    {:ok, _} = run_query(query)

    {:stowed, tkn}
  end

  def get(tkn) do
    case select(tkn) do
      {:ok, type, message} ->
        {:ok, _} = delete(tkn)
        {:ok, type, message}
      {:not_found} ->
        {:not_found}
    end
  end

  defp run_query(query) do
    {:ok, pid} = :cqerl.new_client

    :cqerl.run_query(pid, query)
  end

  defp select(tkn) do
    query = cql_query(
      statement: """
      SELECT type, message
      FROM notes
      WHERE tkn=:tkn
      """,
      values: [ tkn: Fuego.UUID.string_to_binary!(tkn) ]
    )

    {:ok, res} = run_query(query)

    first = :cqerl.head(res)

    case first do
      :empty_dataset ->
        {:not_found}
      _ ->
        type = first[:type]
        message = first[:message]

        {:ok, type, message}
    end
  end

  defp delete(tkn) do
    query = cql_query(
      statement: """
      DELETE FROM notes
      WHERE tkn=:tkn
      """,
      values: [ tkn: Fuego.UUID.string_to_binary!(tkn) ]
    )

    {:ok, res} = run_query(query)
  end

  # TODO: Encrypt messages
  # From http://stackoverflow.com/a/12795014/320471
  # password = base64:encode(crypto:strong_rand_bytes(Bytes)).
end