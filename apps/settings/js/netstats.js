/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var DEBUG_MODE = false;

window.addEventListener('localized', function scanWifiNetworks(evt) {
  // for testing, get data for last 30 min instead of last month
  var precision = 1000 * 60;
  //var precision = 1000 * 60 * 60 * 24;

  var end = new Date(Math.floor(new Date().getTime() / precision) * precision);
  var start = new Date(Math.floor(new Date().getTime() / precision) * precision);
  //start.setMonth(start.getMonth() - 1);
  //var days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  start.setMinutes(start.getMinutes() - 30);
  var days = Math.floor((end - start) / precision);

  //var networkTypes = navigator.mozNetworkStats.types;
  var networkTypes = ['wifi','mobile'];

  // Debug data
  var dataWifi = {
    rxBytes: [26340,25136,26685,26384,24923,26720,27056,27327,26218,27444,27000,45809,45208,27696,25266,28372,27563,31374,28574,25670,27358,27466,27318,22169,39645,24830,27227,26340,24830,0,3759],
    txBytes: [2,72,72,72,66,72,72,72,72,72,72,48,44620,72,72,72,72,72,72,72,72,72,72,6,3400,72,72,72,72,0,30],
    connectionType: 'wifi',
    startDate: start,
    endDate: end
  };

   var dataMobile = {
    rxBytes: [37597,41674,25387,26596,26392,24818,26396,27003,26658,24898,26564,26328,26615,24860,26340,26592,25952,25537,26340,0,0,72959,46493,26508,26844,25042,26664,27255,38846,39829,27908],
    txBytes: [30,3392,72,72,72,72,72,72,72,72,44980,72,72,72,72,72,72,72,72,0,0,18,3394,72,72,72,72,72,36,3400,72],
    connectionType: 'mobile',
    startDate: start,
    endDate: end
  };

  // Graphs colors
  var colorMobile = {
      stroke: '#088e38', 
      fill: '#19df5f', 
      axis: "#000000", 
      grid: "#DDDDDD"
    };

  var colorWifi = {
    stroke: '#3300AA', 
    fill: '#00AAFF', 
    axis: "#000000", 
    grid: "#DDDDDD"
  };

  for(var type in networkTypes){

    if ( networkTypes[type] == 'wifi' ) { var color = colorWifi;  }
    if ( networkTypes[type] == 'mobile' ) { var color = colorMobile; }

   if ( DEBUG_MODE === true ) {

      if ( networkTypes[type] == 'wifi' ) {  var dataDebug = dataWifi; }
      if ( networkTypes[type] == 'mobile' ) { var dataDebug = dataMobile;  }
      var canvas = document.getElementById(dataDebug.connectionType + 'GraphCanvas');
      paint(canvas, dataDebug, color);
      overviewUI(dataDebug);

    } else {

      var req = navigator.mozNetworkStats.getNetworkStats({startDate: start, endDate: end, connectionType: networkTypes[type]});
      req.onsuccess = function (event) {
        var data = event.target.result;
        var canvas = document.getElementById(data.connectionType + 'GraphCanvas');

        paint(canvas, data, color);
        overviewUI(data);
      };
      req.onerror = function () {
        console.log('Error requesting network stats: ' + this.error.name);
      };

    }
  }

  function overviewUI(networkStats) {
    var rx = networkStats.rxBytes;
    var tx = networkStats.txBytes;
    var type = networkStats.connectionType;

    //Sum bytes
    var rxBytes = 0;
    for ( var i in rx ) {
      rxBytes += rx[i];
    }

    var txBytes = 0;
    for ( var i in tx ) {
      txBytes += tx[i];
    }

    //Default MB operations
    var totalMB = (rxBytes + txBytes)/1024;
    totalMB = totalMB.toFixed();
    var value = totalMB;
    var unit = "MB"

    //Convert MB to GB
    if ( totalMB >= 1024 ) {
     value = totalMB / 1024;
     value = value.toFixed(1);
     unit = "GB"
    }

    //Apply to UI
    document.getElementById(type+"Overview").innerHTML = value + unit;

  }

  function paint(canvas, networkStats, color){
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    var x_space = width / days;

    var ctx = canvas.getContext("2d");
    var rx = networkStats.rxBytes;
    var tx = networkStats.txBytes;

    console.log("ConnectionType: " + networkStats.connectionType);
    console.log("StartDate: " + networkStats.startDate);
    console.log("EndDate: " + networkStats.endDate);

    if(rx && tx){
      console.log("Data rx: " + rx);
      console.log("Data tx: " + tx);

      // Check if data is available from start/end date, else insert '0'
      if(networkStats.startDate > start){
        var offset = Math.floor((networkStats.startDate - start) / precision) - 1;
        console.log("add " + offset);
        for(var i = 0; i < offset; i++){
          rx.unshift(0);
          tx.unshift(0);
        }
      }

      if(networkStats.endDate < end){
        var offset = Math.floor((end - networkStats.startDate) / precision) - 1;
        console.log("add " + offset);
        for(var i = 0; i < offset; i++){
          rx.push(0);
          tx.push(0);
        }
      }

      // Normalize data
      var sum = 0;
      for(var i in rx)
        sum += rx[i] + tx[i];

      var scale_factor = height / sum;
      
      // Draw rx data
      var x = 1;
      var y = height - ((rx[0] + tx[0]) * scale_factor);
  
      ctx.strokeStyle = color.stroke;
      ctx.fillStyle = color.fill;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for(var i = 1; i < days - 1; i++){
        x += x_space;
        y -= (rx[i] + tx[i]) * scale_factor;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineTo(x, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Draw tx data
      var x = 1;
      var y = height - (tx[0] * scale_factor);

      ctx.strokeStyle = color.stroke;
      ctx.fillStyle = color.fill;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for(var i = 1; i < days - 1; i++){
        x += x_space;
        y -= tx[i] * scale_factor;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineTo(x, height);
      ctx.lineTo(0, height);
      ctx.fill();
    }

    // Draw axis
    ctx.strokeStyle = color.axis;
    ctx.beginPath();
    ctx.moveTo(1,1);
    ctx.lineTo(1, height);
    ctx.lineTo(width, height);
    ctx.stroke();

    // Draw subX
    var x = 1;

    ctx.strokeStyle = color.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(var i = 1; i < days - 1; i++){
      x += x_space;
      ctx.moveTo(x, height - 1);
      ctx.lineTo(x, 0);
    }
    ctx.stroke();
  }

});

// Font size recalc
document.addEventListener('DOMContentLoaded', function() {
    var regionNetStats = document.getElementById('dataUsage');
    if (window.innerWidth <= window.innerHeight) {
      var changeScale = window.innerWidth / 32;
      regionNetStats.style.fontSize = changeScale + 'px';
      regionNetStats.classList.remove('landscape');
      regionNetStats.classList.add('portrait');
    } else {
      var changeScale = window.innerWidth / 64;
      regionNetStats.style.fontSize = changeScale + 'px';
      regionNetStats.classList.remove('portrait');
      regionNetStats.classList.add('landscape');
    }
})


