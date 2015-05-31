"use strict";

import React from 'react';
import {Link} from 'react-router';

const EXAMPLES = {
  "abc": "A video",
  "def": "A doc",
};

export class Dashboard extends React.Component {
  render() {
    let examplesList = Object.keys(EXAMPLES).map((pool_id) => {
      return (
        <li>
          <Link to="pool" params={{pool_id: pool_id}}>{EXAMPLES[pool_id]}</Link></li>
      );
    });

    return (
      <div className="dashboard">
        <h1>Dashboard</h1>

        <p>
          VCR.Link makes it easy to send files directly to friends or co-workers. Simply select a file from your computer and you'll create
          a vcr link (e.g. https://vcr.link#/abcdefg). Send a friend this link and when they open it, you'll start sending the file
          directly to them. Once your friend on the other end gets this file, they can keep it stored in VCR.Link, download it,
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
