import React, { Component } from "react";
import { Link } from "react-router-dom";

export default class OtherPage extends Component {
  render() {
    return (
      <div>
        I m some other page!
        <Link to="/">Go back to the homepage</Link>
      </div>
    );
  }
}
