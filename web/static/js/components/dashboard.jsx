"use strict";

import React from 'react';
import {Link} from 'react-router';

const EXAMPLES = {
  "8fd0cb083d634b320d86550b116e4bcfac4c54d6b00a7fff5ff85eabb3dcb2cc": "A Document",
  "63205cc0f66c2efb9d58a32548350d5c5b414e5996da9f6252724ecb54a2a5bb": "A Picture",
  "9a177a8cad9a8dcba77a58f76ca7af8b82b80a6ccb4bf301fea9c1863b4d0ca6": "A Video"
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
          a VCR link (e.g. https://vcr.link#/abcdefg). Send a friend this link and when they open it, you'll start sending the file
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
