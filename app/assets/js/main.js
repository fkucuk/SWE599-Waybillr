const endpoints = {
  'gc' : 'https://firestore.googleapis.com/v1beta1/projects/swe599-waybill/databases/(default)/documents/companies',
  'pc' : 'https://firestore.googleapis.com/v1beta1/projects/swe599-waybill/databases/(default)/documents/companies',
  'gp' : 'https://firestore.googleapis.com/v1beta1/projects/swe599-waybill/databases/(default)/documents/products/',
  'gl' : 'https://swe599-waybill.firebaseio.com/provinces.json'
}

const GET_COMPANIES = 'gc', GET_PRODUCTS = 'gp', GET_LOCATIONS = 'gl', POST_COMPANY = 'pc'
const NAV_MENU_COMPANY = '.nav-company'
const NAV_MENU_COMPANY_ADD = '.nav-company-add'

var companyArray, productArray, provinceArray;
var currentCompany = null;
var currentProvince = null;
var currentProducts = {}
var flag_camera_open = false;

var app = {

  init: function() {
    app.getProvinces()
    app.getCompanies()
  },
  
  addProductToWaybill: function(barcodeNumber) {
      
    var product = app.findProduct(barcodeNumber)
      
      if(product) {
        if(currentProducts[product.fields.barcode.stringValue] == undefined) {
          currentProducts[product.fields.barcode.stringValue] = {description: product.fields.description.stringValue, quantity: 1}
        }else {
          currentProducts[product.fields.barcode.stringValue].quantity++
        }
      }else{
        console.warn('barcode is not registered');
      }

      app.refreshProductList()
  },
  startCamera: function() {
    // const codeReader = new ZXing.BrowserQRCodeReader()

    // codeReader.getVideoInputDevices()
    //   .then((videoInputDevices) => {
    //     const sourceSelect = document.getElementById('sourceSelect')
    //     const firstDeviceId = videoInputDevices[0].deviceId
    //     if (videoInputDevices.length > 1) {
    //       videoInputDevices.forEach((element) => {
    //         const sourceOption = document.createElement('option')
    //         sourceOption.text = element.label
    //         sourceOption.value = element.deviceId
    //         sourceSelect.appendChild(sourceOption)
    //       })
    //     }

    //     document.getElementById('startButton').addEventListener('click', () => {
    //       codeReader.decodeFromInputVideoDevice(firstDeviceId, 'video').then((result) => {
    //         console.log(result)
    //         document.getElementById('result').textContent = result.text
    //       }).catch((err) => {
    //         console.error(err)
    //         document.getElementById('result').textContent = err
    //       })
    //       console.log(`Started continous decode from camera with id ${firstDeviceId}`)
    //     })
    QuaggaApp.init();

    Quagga.onDetected(function (result) {
      Quagga.stop();
      Quagga.offDetected();
      var code = result.codeResult.code;
      app.navigateTo('btn-add-waybill');
      app.addProductToWaybill(code);
    });

      // })
  },
  refreshProductList: function() {

    if(currentProducts) {

      var output = '';
      var total = 0;

      for(var key in currentProducts) {
          output += '<div class="col-4">' + key+ '</div>' +
          '<div class="col-6">' + currentProducts[key].description + '</div>' +
          '<div class="col-2 text-right">' + currentProducts[key].quantity + '</div>'

          total += parseInt(currentProducts[key].quantity)
      }

      $('#wb-total-quantity').html(total)
      $('#wb-products-list').html(output)
    }

  },

  findProduct: function(barcodeNumber) {

    var product = null

    if(productArray && productArray.length > 0) {
      productArray.forEach(element => {
        
        if(element.fields.barcode.stringValue == barcodeNumber) {
            product = element
        }
      });
    }


    return product
  },

  getProducts: function () {
    //TODO cache control before requesting from server

    $.ajax({
      url: endpoints[GET_PRODUCTS],
      type: 'GET',
      dataType: 'json',
      success: function (data, textStatus, jqXHR) {
        if (typeof data.error === 'undefined') {
          // Success so call function to process the form

          // console.log(data.documents[0].fields.name.stringValue)

          productArray = data.documents

        }else {
          // Handle errors here
          console.log('ERRORS: ' + data.error)
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // Handle errors here
        console.log('ERRORS: ' + textStatus)
      // STOP LOADING SPINNER
      }
    })
  },

  getCompanies: function () {
    //TODO cache control before requesting from server

    $.ajax({
      url: endpoints[GET_COMPANIES],
      type: 'GET',
      dataType: 'json',
      success: function (data, textStatus, jqXHR) {
        if (typeof data.error === 'undefined') {
          // Success so call function to process the form

          // console.log(data.documents[0].fields.name.stringValue)

          companyArray = data.documents

        }else {
          // Handle errors here
          console.log('ERRORS: ' + data.error)
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // Handle errors here
        console.log('ERRORS: ' + textStatus)
      // STOP LOADING SPINNER
      }
    })
  },

  dumpCompanies: function() {

      var output = '';

      companyArray.forEach(element => {
          output += '<li>' + (element.fields.name.stringValue) + '</li>';
       });

       $('#company-list').html(output)

       $('#company-list > li').click(function (e) {
        $(e.target).toggleClass('selected')
      })
  },

  listCompanies: function(e) {
          
      var output = '<option value="-1">Select company</option>';

      companyArray.forEach(element => {
          output += '<option>' + (element.fields.name.stringValue) + '</option>';
        });

        $('#company-dropdown').html(output)

      //  $('#company-list > li').click(function (e) {
      //   $(e.target).toggleClass('selected')
      // })
  },
  
  //get province
  getProvinces: function () {
    //TODO cache control before requesting from server

    $.ajax({
      url: endpoints[GET_LOCATIONS],
      type: 'GET',
      dataType: 'json',
      success: function (data, textStatus, jqXHR) {
        if (typeof data.error === 'undefined') {
          // Success so call function to process the form

          // console.log(data.documents[0].fields.name.stringValue)

          provinceArray = data

        }else {
          // Handle errors here
          console.log('ERRORS: ' + data.error)
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // Handle errors here
        console.log('ERRORS: ' + textStatus)
      // STOP LOADING SPINNER
      }
    })
  },

  //list province
  listProvinces: function(e) {
          
      var output = '<option value="-1">Select province</option>';

      provinceArray.forEach(element => {
          output += '<option value="' + element.code + '">' + element.name + '</option>';
        });

        $('#province-dropdown').html(output)
  },

  findProvince: function (code) {

      var province = ''
      provinceArray.forEach(element => {
        if(element.code == parseInt(code)) {
          province = element.name
        }
      });

      return province
  },

  findDistrict: function (code) {

    var district = ''
    provinceArray.forEach(element => {
      if(element.code == parseInt(currentCompany.fields.provincegeoid.integerValue)) {
        element.districts.forEach(element => {
            if(element.code == code) {
              district = element.name
            }
        })
      }
    })

    return district
},

  showNavigation: function(sectionClass) {

      //hide specific navigation items
      $('.actionbar .nav-item').fadeOut().promise().done(function() {

        $(sectionClass).fadeIn()
      })
  },

  saveCompany: function() {

    console.log(JSON.stringify({
      "name": "",
      "fields": {
          "provincegeoid": {
              "integerValue": $('#com-province').val()
          },
          "localaccountnumber": {
              "stringValue": $('#com-account-number').val()
          },
          "websiteurl": {
              "stringValue": $('#com-website').val()
          },
          "addressline2": {
              "stringValue": ""
          },
          "isactive": {
              "booleanValue": true
          },
          "countrygeoid": {
              "integerValue": "1"
          },
          "districtgeoid": {
              "integerValue": $('#com-district').val()
          },
          "name": {
              "stringValue": $('#com-name').val()
          },
          "addressline1": {
              "stringValue": $('#com-address').val()
          }
      }
  })
)
    $.ajax({
        url: "https://firestore.googleapis.com/v1beta1/projects/swe599-waybill/databases/(default)/documents/companies?documentId=" + $('#com-name').val(),
        type: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
        contentType: "application/json",
        data: JSON.stringify({
            "name": "",
            "fields": {
                "provincegeoid": {
                    "integerValue": $('#province-dropdown').val()
                },
                "localaccountnumber": {
                    "stringValue": $('#com-account-number').val()
                },
                "websiteurl": {
                    "stringValue": $('#com-website').val()
                },
                "addressline2": {
                    "stringValue": ""
                },
                "isactive": {
                    "booleanValue": true
                },
                "countrygeoid": {
                    "integerValue": "1"
                },
                "districtgeoid": {
                    "integerValue": $('#district-dropdown').val()
                },
                "name": {
                    "stringValue": $('#com-name').val()
                },
                "addressline1": {
                    "stringValue": $('#com-address').val()
                }
            }
        })
    })
    .done(function(data, textStatus, jqXHR) {
        console.log("HTTP Request Succeeded: " + jqXHR.status);
        console.log(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log("HTTP Request Failed");
    })
    .always(function() {
        /* ... */
    });
  
    // $.ajax({
    //   url: endpoints[GET_COMPANIES],
    //   type: 'POST',
    //   dataType: 'json',
    //   data: {
    //     name: "",
    //     fields: {
    //       websiteurl: {
    //         stringValue: $('com-website').val()
    //       },
    //       localaccountnumber: {
    //         stringValue: $('com-account-number').val()
    //       },
    //       name: {
    //         stringValue: $('com-name').val()
    //       },
    //       addressline1: {
    //         stringValue: $('com-address').val()
    //       },
    //       addressline2: {
    //         stringValue: ""
    //       },
    //       countrygeoid: {
    //         integerValue: "1"
    //       },
    //       districtgeoid: {
    //         integerValue: $('com-district').val()
    //       },
    //       provincegeoid: {
    //         integerValue: $('com-province').val()
    //       },
    //       isactive: {
    //         booleanValue: true
    //       }
    //     }
    //   },
    //   success: function (data, textStatus, jqXHR) {
    //     if (typeof data.error === 'undefined') {
    //       // Success so call function to process the form

    //       // console.log(data.documents[0].fields.name.stringValue)

    //       companyArray = data.documents

    //       callback()
    //     }else {
    //       // Handle errors here
    //       console.log('ERRORS: ' + data.error)
    //     }
    //   },
    //   error: function (jqXHR, textStatus, errorThrown) {
    //     // Handle errors here
    //     console.log('ERRORS: ' + textStatus)
    //   // STOP LOADING SPINNER
    //   }
    // })
  },
  
  navigateTo: function(sectionId)  {

    switch (sectionId) {
      
      case 'btn-company': //show company list
        $('section').fadeOut().promise().done(function () {
          
          app.showNavigation(NAV_MENU_COMPANY)
          $('section#companylist').fadeIn()

          $('.actionbar').slideDown(300)

          app.dumpCompanies()

        })
        break
      
      case 'btn-add-waybill': //show waybill form

        $('section').fadeOut().promise().done(function () {
          
          $('section#waybill').fadeIn()
          $('.actionbar').slideDown(300)

          app.listCompanies()
          app.getProducts()

        })
        break

      case 'btn-add-company': //show add-company form

        $('section').fadeOut().promise().done(function () {
          
          app.showNavigation(NAV_MENU_COMPANY_ADD)
          app.listProvinces()

          $('section#add-company').fadeIn()
          $('.actionbar').slideDown(300)

        })
        break
      
      case 'btn-save-company': //show add-company form
        
        app.saveCompany()

        break
      case 'btn-open-camera':
        $('section').fadeOut().promise().done(function () {         

          $('section#camera-container').slideDown(300)
          flag_camera_open = true;
          app.startCamera()
        
        })
        
        break
      }
  }
  
}


;(function ($) {
  'use strict' // Start of use strict

  // Smooth scrolling using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function () {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash)
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']')
      if (target.length) {
        $('html, body').animate({
          scrollTop: (target.offset().top - 54)
        }, 1000, 'easeInOutExpo')
        return false
      }
    }
  })

  // Closes responsive menu when a scroll trigger link is clicked
  $('.js-scroll-trigger').click(function () {
    $('.navbar-collapse').collapse('hide')
  })

  // Activate scrollspy to add active class to navbar items on scroll
  $('body').scrollspy({
    target: '#mainNav',
    offset: 54
  })

  // ====
  app.init()

  //Navigation
  $('.actionbar .nav-link, .cam-btn, .navbox').click(function (e) {
    app.navigateTo(e.target.id)
  }) 

  //Go home yankee
  $('#back').click(function() {

    if (!flag_camera_open) $('.actionbar').slideUp(300)
    //hide specific navigation items
    $('.actionbar .nav-item').fadeOut()

    $('section').fadeOut().promise().done(function () {
      
      if (!flag_camera_open){ 
        // normal action
        $('section#home').fadeIn()
      }else{
        $('section#waybill').fadeIn()
        flag_camera_open = false;
      }
    })
  })



  // Waybill Form
  $('#company-dropdown').change(function() {
    console.log(this.selectedIndex)

    currentCompany = companyArray[this.selectedIndex - 1]

    console.log(currentCompany)

    var output = '';
    output += currentCompany.fields.name.stringValue + '<br>'

    if(currentCompany.fields.addressline1.stringValue != '')
      output += currentCompany.fields.addressline1.stringValue + '<br>'
      
    output += app.findDistrict(currentCompany.fields.districtgeoid.integerValue) + ' / ' 
    output += app.findProvince(currentCompany.fields.provincegeoid.integerValue)

    $('#receiver-info').html(output)
  })

  //Add product
  $('#form-add-product').submit(function(e) { 
    e.preventDefault()
    e.stopImmediatePropagation()
    
    var barcodeNumber = $('#wb-barcode-number').val()

    app.addProductToWaybill(barcodeNumber)
    

    //wb-products-list
  })

  // Company Form
  $('#province-dropdown').change(function() {
    console.log(this.selectedIndex)

    currentProvince = provinceArray[this.selectedIndex - 1]

    console.log(currentProvince)

    var districtArray = currentProvince.districts

    var output = '<option value="-1">Select province</option>';
    
    districtArray.forEach(element => {
        output += '<option value="' + element.code + '">' + (element.name) + '</option>';
      });

      $('#district-dropdown').html(output)
  })

  $('#wb-print-btn').click(function() {

    if(!currentCompany) {
      alert('Please select a company');
      return;
    }
    
    var element = $('#pf-waybill').get(0)

    // receiver info
    var output = '';

    if(currentCompany) {
      output += currentCompany.fields.name.stringValue + '<br>'

      if(currentCompany.fields.addressline1.stringValue != '') {
        output += currentCompany.fields.addressline1.stringValue + '<br>'
      }

      output += currentCompany.fields.addressline2.stringValue + '<br>'
    }

    $('#pf-receiver-info').html(output)

    $('#pf-wb-date').html($('#waybill-date').val())
    $('#pf-wb-serie').html($('#waybill-serie').val())
    $('#pf-wb-number').html($('#waybill-number').val())

    // products
    if(currentProducts) {
      
      output = '';
      var total = 0;

      for(var key in currentProducts) {
          output += '<div class="col-4">' + key+ '</div>' +
          '<div class="col-6">' + currentProducts[key].description + '</div>' +
          '<div class="col-2 text-right">' + currentProducts[key].quantity + '</div>'

          total += parseInt(currentProducts[key].quantity)
      }

      $('#pf-total-quantity').html(total)
      $('#pf-products-list').html(output)
    }

    html2pdf(element, {
      margin:       1,
      filename:     'Waybill_' + currentCompany.fields.name.stringValue + '_' + new Date(Date.now()).toLocaleDateString() + '.pdf',
      image:        { type: 'jpeg', quality: 0.85 },
      html2canvas:  { dpi: 192, letterRendering: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    });
  })

  
})(jQuery) // End of use strict
