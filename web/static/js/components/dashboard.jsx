"use strict";

import React from 'includes/react';
import {Link} from 'includes/react-router';
import {POOL_EXAMPLES} from 'services/config';

export class Dashboard extends React.Component {
  render() {
    let examplesList = Object.keys(POOL_EXAMPLES).map((pool_id) => {
      return (
        <li key={pool_id}>
          <Link to="pool" params={{pool_id: pool_id}}>{POOL_EXAMPLES[pool_id]}</Link>
        </li>
      );
    });

    return (
      <div className="dashboard">
        <h1>Dashboard</h1>

        <p>
          Fuego.link makes it easy to send files directly to friends or co-workers. Simply select a file from your computer and you'll create
          a Fuego link (e.g. https://fuego.link#/abcdefg). Send a friend this link and when they open it, you'll start sending the file
          directly to them. Once your friend on the other end gets this file, they can keep it stored in Fuego.link, download it,
          or view it in the browser.
        </p>

        <h2>Examples</h2>

        <ul>
          {examplesList}
        </ul>
      </div>
    )
  }
}
