function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
var code = getParameterByName('code');
window.history.pushState({}, document.title, "/dashboard" + "");

function tokensOrBust() {
  if(getCookie("token") == "" || getCookie("token") == null ) {
    if(code) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.trtl.tv/code", true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
          code: code
      }));
      xhr.onload = function() {
        profile = JSON.parse(this.responseText);
        if (this.status == 400) {
          window.location = "https://www.streamlabs.com/api/v1.0/authorize?client_id=e4lKhBGqlUblZ8JhIdW1jCvRqrQ6k4OjRSUcazTE&redirect_uri=https://trtl.tv/dashboard/&response_type=code&scope=donations.create";
        }
        document.cookie = "token="+profile.token;
        window.history.pushState({}, document.title, "/dashboard" + "");
        submit();
      }
    } else {
      window.location.replace("https://www.streamlabs.com/api/v1.0/authorize?client_id=e4lKhBGqlUblZ8JhIdW1jCvRqrQ6k4OjRSUcazTE&redirect_uri=https://trtl.tv/dashboard/&response_type=code&scope=donations.create")
    };
  }
}

var profile;
function submit() {
  $.getJSON('https://api.coinmarketcap.com/v2/ticker/2958/?convert=USD', function(data) {
    var transactionTable = '';
    $.each(transactionsJSON(data.data.quotes.USD.price), function(index, value){
      if (value.transactions !== undefined && value.transactions.length != 0) {
        $.each(value.transactions, function(index2, value2){
          transactionTable += '<tr>' +
              '<td sorttable_customkey="' + value2.timestamp + '">'+moment.unix((value2.timestamp)).fromNow()+'</td>' +
              '<td>'+convertExtraToName(value2.extra)+'</a></td>' +
              '<td>'+convertExtraToMessage(value2.extra)+'</td>' +
              '<td sorttable_customkey="' + value2.amount + '">'+(value2.amount/100).toFixed(2)+'</td>' +
              '<td>'+(data.data.quotes.USD.price * (value2.amount/100)).toFixed(6)+'</td>' +
            '</tr>';
        });
      };
    });
    if(transactionTable === '') {
      return
    }
    $('#rows').html(transactionTable);
    sorttable.innerSortFunction.apply(document.getElementById("time"), []);
  });

}

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function copyToClipboard(element) {
 var $temp = $("<input>");
 $("body").append($temp);
 $temp.val($(element).html()).select();
 document.execCommand("copy");
 $temp.remove();
}

function convertExtraToName(extra) {
  try {
    extra = "7b226e" + extra.split("7b226e").pop();
    var x = JSON.parse(hex2a(extra));
    return x.name
  }
  catch(err) {
    return "Anonymous";
  }
}

function convertExtraToMessage(extra) {
  try {
    extra = "7b226e" + extra.split("7b226e").pop();
    var x = JSON.parse(hex2a(extra));
    return x.message
  }
  catch(err) {
    return "None";
  }
}


lastTransactions = []
function transactionsJSON(usdPrice) {
    var resp ;
    var xmlHttp ;

    resp  = '' ;
    xmlHttp = new XMLHttpRequest();

    var token = getCookie("token");
    if (token == "" || token == null) {
        return
    }

    if(xmlHttp != null)
    {
        xmlHttp.open( "GET", "https://api.trtl.tv/userStats", false );
        xmlHttp.setRequestHeader('Content-Type', 'application/json');
        xmlHttp.setRequestHeader("Authorization", "Basic " + btoa(token + ":" + 'nonce'));
        xmlHttp.send( null );
        resp = xmlHttp.responseText;
    }
    if(xmlHttp.status == 401) {
      console.log('Invalid tokens, clearing cookies and trying again');
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      tokensOrBust();
    }
    json = JSON.parse(resp);
    document.getElementById("address").innerHTML = json.address;
    document.getElementById("userLink").innerHTML = "https://trtl.tv/" + capitalizeFirstLetter(json.name);
    document.getElementById("userLink").href = "https://trtl.tv/" + capitalizeFirstLetter(json.name);

    document.getElementById("blockCount").innerHTML = capitalizeFirstLetter(Boolean(Math.abs(json.status.blockCount - json.status.knownBlockCount) < 5).toString());

    document.getElementById("available_balance").innerHTML = (json.balance.availableBalance/100).toFixed(2);
    document.getElementById("locked_amount").innerHTML = (json.balance.lockedAmount/100).toFixed(2);
    document.getElementById("usd_balance").innerHTML = ((json.balance.availableBalance/100)*usdPrice).toFixed(2);

    document.getElementById("minalert_amount").placeholder = json.minAlert;

    if(lastTransactions.length === json.transactions.length) {return}
    lastTransactions = json.transactions

    return json.transactions;
}

function withdraw(address) {

  address = address.replace(/\s/g,'');

  var resp ;
  var xmlHttp ;
  resp  = '' ;
  xmlHttp = new XMLHttpRequest();
  var token = getCookie("token");
  if (token == "" || token == null) {
      return
  }

  if(!address) {
    swal("Error!", "You must enter an address to withdraw to!", "error");
    return
  }

  if(!/^TRTL(?:[0-9A-Z]{95}|[0-9A-Z]{183})$/gmi.test(address)) {
    console.log('Invalid address!');
    swal("Invalid address!", "", "error",);
    return
  }
  if(address === document.getElementById('address').innerHTML) {
    console.log('Invalid address!');
    swal("Withdraw address cannot be your TwitchTurtle address", "", "error");
    return
  }

  swal({
    title: 'Are you sure the information is correct?',
    text: "Withdraw to " + address + "\n PLEASE NOTE: THIS IS IRREVERSABLE!\n YOU CANNOT SEND DIRECTLY TO AN EXCHANGE!",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  })
  .then((willDelete) => {
    if (willDelete) {
      if(xmlHttp != null)
      {
          xmlHttp.open( "GET", "https://api.trtl.tv/withdraw/" + address.replace(/\s/g,''), false );
          xmlHttp.setRequestHeader('Content-Type', 'application/json');
          xmlHttp.setRequestHeader("Authorization", "Basic " + btoa(token + ":" + 'nonce'));
          xmlHttp.send( null );
          resp = xmlHttp.responseText;
      }
      if(xmlHttp.status == 401) {
        console.log('Invalid tokens, clearing cookies and trying again');
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        tokensOrBust();
      }
      if(xmlHttp.status == 400) {
        console.log('Error');
        swal(
          'Error!',
          JSON.parse(resp).error,
          'error'
        )
      }
      json = JSON.parse(resp);
      swal("Success!", "Your withdraw has gone through! You should see it in your wallet soon.", "success",);
    } else {
      swal("Withdraw Cancelled!", "", "error",);
    }
  });
}

function minAlert() {
    var token = getCookie("token");
    if (token == "" || token == null) {
        return
    }
    var minAlertNum = document.getElementById('minalert_amount').value
    if (!minAlertNum) {
        var minAlertNum = "0"
    }
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.trtl.tv/minAlert", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader("Authorization", "Basic " + btoa(token + ":" + 'nonce'));
    xhr.send(JSON.stringify({
    	minAlertNum: minAlertNum
    }));
    xhr.onload = function() {
    	document.getElementById("minalert_amount").placeholder = JSON.parse(this.responseText).minAlertNum;
    }
}

function logout() {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    location = "https://trtl.tv";
}

$(document).ready(function() {tokensOrBust();submit();setInterval(submit, 10000);console.log('%cTwitchTurtle Dev Console', 'background: green; color: white; font-size: 55px');console.log('%cDo not paste anything into this console unless you know EXACTLY what you are doing. There is a high chance of you getting hacked if you are not careful. If you do know what you are doing, come help the project out at https://chat.trtl.tv', 'background: red; color: white; font-size: 35px');});
