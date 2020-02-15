import React, { Component } from "react";
import Web3 from "web3";
import ReactMapGL, { Marker } from "react-map-gl";
import Loader from "react-loader-spinner";

import getAlert from './utils/getAlert';
import "./App.css";
import bell from "./assets/images/bell.png";
import marker from "./assets/images/marker.png";
import searchIcon from "./assets/images/search.png";

var passworder = require("browser-passworder");
const ipfsClient = require("ipfs-http-client");
const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: "5001",
  protocol: "https"
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      buffer: null,
      contract: null,
      recordHash: "",
      account: "",
      records: [],
      place: "",
      caseName: "",
      searchQuery: "",
      danger: false,
      showMarker: false,
      lashkar: false,
      loading: false,
      viewport: {
        latitude: 26.2183,
        longitude: 78.1828,
        width: "43vw",
        height: "40vh",
        zoom: 10
      }
    };
  }

  async componentWillMount() {
    fetch("http://127.0.0.1:8000/Traffic/default/call/json/final", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    })
      .then(response => response.json())
      .then(response => {
        console.log(response);
        if (response < 5) this.setState({ danger: true });
      })
      .catch(err => console.log(err));
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });
    console.log(accounts);

    const abi = [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "string",
            "name": "recordHash",
            "type": "string"
          }
        ],
        "name": "RecordAdded",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "_caseName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_recordHash",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_area",
            "type": "string"
          }
        ],
        "name": "set",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "_area",
            "type": "string"
          }
        ],
        "name": "get",
        "outputs": [
          {
            "internalType": "string[2][]",
            "name": "",
            "type": "string[2][]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];
    const address = "0x0799e7a828c6734b89E3768D1eB66dD7Ec8Ba201";
    const contract = new web3.eth.Contract(abi, address);
    this.setState({ contract });
    console.log(this.state.contract);
    const records = await contract.methods.get("morena").call();
    console.log("records", records);

    const decrypedRecords = [];
    for (var i = 0; i < records.length; ++i) {
      const decryptedHash = await passworder.decrypt(
        process.env.REACT_APP_ENCRYPTION_KEY,
        records[i][1]
      );
      decrypedRecords.push([records[i][0], decryptedHash]);
    }

    this.setState({
      decrypedRecords
    });
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }
    if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert("please use metamask");
    }
  }

  captureFile = event => {
    event.preventDefault();
    console.log("file captured");
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) });
    };
  };

  onSubmit = event => {
    const toast = getAlert();
    event.preventDefault();
    console.log("submitting form");
    this.setState({ loading: true });
    ipfs.add(this.state.buffer, async (error, result) => {
      console.log("ipfs result", result);
      const recordHash = result[0].hash;
      if (error) {
        alert("error ipfs", error);
        this.setState({ loading: false });
        return;
      }
      try {
        let encryptedHash = await passworder.encrypt(
          process.env.REACT_APP_ENCRYPTION_KEY,
          recordHash
        );
        const receipt = await this.state.contract.methods
          .set(
            this.state.caseName,
            encryptedHash,
            this.state.place.toLowerCase()
          )
          .send({ from: this.state.account });
        console.log("receipt", receipt);
        this.setState({ loading: false });
        if (this.state.place === "Morena"){
          this.setState({
            decrypedRecords: [
              ...this.state.decrypedRecords,
              [this.state.caseName, recordHash]
            ],
            caseName: "",
            place: ""
          });
        }
        toast.fire({
          icon: 'success',
          title: 'Record has been successfully added.',
        });
      } catch (err) {
        console.log(err);
        this.setState({ loading: false });
        toast.fire({
          icon: 'error',
          title: 'There was some issue, please try again.',
        });
      }
    });
  };

  openModal = () => {
    if (this.state.danger) {
      const modal = document.getElementById("modal");
      modal.style.display = "flex";
      modal.style.opacity = 1;
    }
  };

  closeModal = () => {
    const toast = getAlert();
    const modal = document.getElementById("modal");
    modal.style.display = "none";
    modal.style.opacity = 0;
    this.setState({ danger: false });
    this.setState({ showMarker: true });
    toast.fire({
      icon: 'success',
      title: 'Police force has been successfully deployed.',
    });
    setTimeout(() => {
      this.setState({ danger: true });
    }, 15000);
  };

  openModal2 = () => {
    if (this.state.danger) {
      const modal = document.getElementById("modal2");
      modal.style.display = "flex";
      modal.style.opacity = 1;
    }
  };

  closeModal2 = () => {
    const toast = getAlert();
    const modal = document.getElementById("modal2");
    modal.style.display = "none";
    modal.style.opacity = 0;
    this.setState({ danger: false });
    this.setState({ lashkar: true });
    toast.fire({
      icon: 'success',
      title: 'Police force has been successfully deployed.',
    });
  };

  render() {
    const regex = new RegExp(this.state.searchQuery, "i");
    const recordCards = this.state.decrypedRecords
      ? this.state.decrypedRecords
          .filter(record => regex.test(record[0]))
          .map((record, index) => {
            console.log(regex.test(record[0]));
            return (
              <div className="report-card" key={index}>
                <div>Case Name : {record[0]}</div>
                <div>
                  <a href={`https://ipfs.infura.io/ipfs/${record[1]}`}>
                    Click here to see the record
                  </a>
                </div>
              </div>
            );
          }).reverse()
      : null;

    return (
      <div>
        <nav>
          <div>SENTINEL</div>
          <div
            onClick={this.state.showMarker ? this.openModal2 : this.openModal}
          >
            <img src={bell} height="40px" width="40px" alt="bell" id="bell" />
            {this.state.danger ? (
              <div className="notification-circle">
                <p className="notification-number">1</p>
              </div>
            ) : null}
          </div>
        </nav>
        <div className="container">
          <div className="control-panel">CONTROL PANEL</div>
          <div className="form-container">
            <div>
              Upload Report
              <form onSubmit={this.onSubmit}>
                <label>
                  Case Name
                  <input
                    type="text"
                    placeholder="Enter Name of Case"
                    onChange={name =>
                      this.setState({ caseName: name.target.value })
                    }
                    style={{ marginLeft: "60px" }}
                    value={this.state.caseName}
                  />
                </label>
                <label>
                  Place of Crime
                  <input
                    type="text"
                    placeholder="Enter Place of Crime"
                    onChange={place =>
                      this.setState({ place: place.target.value })
                    }
                    value={this.state.place}
                  />
                </label>
                <label>
                  Upload Record
                  <input
                    type="file"
                    placeholder="Upload File"
                    onChange={this.captureFile}
                  />
                </label>
                <button type="submit">
                  {this.state.loading ? (
                    <Loader
                      type="TailSpin"
                      color="#ffffff"
                      height={25}
                      width={30}
                    />
                  ) : (
                    "SUBMIT"
                  )}
                </button>
              </form>
            </div>
          </div>
          <div className="map-parent">
            <div className="report-container">
              <p>Crime Records</p>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search..."
                  className="search"
                  value={this.state.searchQuery}
                  onChange={search =>
                    this.setState({ searchQuery: search.target.value })
                  }
                />
                <img src={searchIcon} className="search-icon" />
              </div>
              {recordCards}
            </div>
            <div className="map-parent-container">
              <p>Patrol Regions</p>
              <div className="map-container">
                <div>
                  <ReactMapGL
                    {...this.state.viewport}
                    mapboxApiAccessToken="pk.eyJ1IjoiZ3VuYXNoZWthcjAyIiwiYSI6ImNrNW13b3RjajBzcnMzb3BjdnBsamxlN3QifQ.5oMM26gc-p2TAv93L2yuyA"
                    onViewportChange={viewport => {
                      this.setState({ viewport });
                    }}
                    mapStyle="mapbox://styles/gunashekar02/ck5mx3kc255nd1io9yea10mdo"
                  >
                    <Marker latitude={26.3195} longitude={78.3089}>
                      <div>
                        <p>MORAR</p>
                        <img
                          src={marker}
                          alt={"Marker"}
                          height="50px"
                          width="50px"
                        ></img>
                      </div>
                    </Marker>
                    {this.state.lashkar ? (
                      <Marker latitude={26.2883} longitude={78.1928}>
                        <div>
                          <p>LASHKAR</p>
                          <img
                            src={marker}
                            alt={"Marker"}
                            height="50px"
                            width="50px"
                          ></img>
                        </div>
                      </Marker>
                    ) : null}
                    {this.state.showMarker ? (
                      <Marker latitude={26.2183} longitude={78.1828}>
                        <div>
                          <p>MORENA</p>
                          <img
                            src={marker}
                            alt={"Marker"}
                            height="50px"
                            width="50px"
                          ></img>
                        </div>
                      </Marker>
                    ) : null}
                  </ReactMapGL>
                </div>
              </div>
            </div>
          </div>
          <div id="modal">
            <h1>ALERT!</h1>
            <h2>Very less activity was detected at Sector 45, Morena.</h2>
            <button type="button" onClick={this.closeModal}>
              Secure Location
            </button>
          </div>
          <div id="modal2">
            <h1>ALERT!</h1>
            <h2>Emergency was detected at 4/77, Lashkar.</h2>
            <button type="button" onClick={this.closeModal2}>
              Secure Location
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
