window.addEventListener('load', () => {
  const el = $('#app');

  // Compile Handlebar Templates
  const errorTemplate = Handlebars.compile($('#error-template').html());
  const ratesTemplate = Handlebars.compile($('#rates-template').html());
  const exchangeTemplate = Handlebars.compile($('#exchange-template').html());
  const historicalTemplate = Handlebars.compile($('#historical-template').html());

  // Router declaration
  const router = new Router({
    mode: 'history',
    page404: (path) => {
      const html = errorTemplate({
        color: 'yellow',
        title: 'Error 404 - Page NOT Found!',
        message: `The path '/${path}' does not exist on this site`,
      });
      el.html(html);
    },
  });

  const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    timeout: 5000,
  });

  // Display error banner
  const showError = (error) => {
    const { title, message } = error.response.data;
    const html = errorTemplate({ color: 'red', title, message });
    el.html(html);
  };

  // Display latest currency rates
  router.add('/', async () => {
    // Display loader first
    let html = ratesTemplate();
    el.html(html);

    try {
      // Load currency rates
      const response = await api.get('/rates');
      const { base, date, rates } = response.data;

      // Display rates table
      html = ratesTemplate({ base, date, rates });
      el.html(html);
    } catch (error) {
      showError(error);
    } finally {
      // Remove loader status
      $('.loading').removeClass('loading');
    }
  });

  // Perform POST req, calculate and disply conversion results
  const getconversionResult = async () => {

  // Extract form data
    const from = $('#from').val();
    const to = $('#to').val();
    const amount = $('#amount').val();

    // Send post data
    try {
      const response = await api.post('/convert', { from, to });
      const { rate } = response.data;
      const result = rate * amount;
      $('#result').html(`${to} ${result}`);
    } catch (error) {
      showError(error);
    } finally {
      $('#result-segment').removeClass('loading');
    }
  };

  // Handle Convert button click
  const convertRatesHandler = () => {
    if ($('.ui.form').form('is valid')) {
      // hide error message
      $('.ui.error.message').hide();

      // post to express Server
      $('#result-segment').addClass('loading');
      getconversionResult();
      // Prevent page from submitting to Server
      return false;
    }
    return true;
  }

  router.add('/exchange', async () => {
    let html = exchangeTemplate();
    el.html(html);
    try {
      // load symbols
      const response = await api.get('/symbols');
      const { symbols } = response.data;
      html = exchangeTemplate({ symbols });
      el.html(html);
      $('.loading').removeClass('loading');
      // validate input
      $('.ui.form').form({
        fields: {
          from: 'empty',
          to: 'empty',
          amount: 'decimal'
        },
      });

      //speciy submit handler
      $('.submit').click(convertRatesHandler);
    } catch (error) {
      showError(error);
    }
  });

  const getHistoricalRates = async () => {
    const date = $('#date').val();
    try {
      const response = await api.post('/historical', { date });
      const { base, rates } = response.data;
      const html = ratesTemplate({ base, date, rates });
      $('#historical-table').html(html);
    } catch (error) {
      showError(error);
    } finally {
      $('.segment').removeClass('loading');
    }
  };

  const historicalRatesHandler = () => {
    if ($('.ui.form').form('is valid')) {
      // hide error message
      $('.ui.error.message').hide();
      // indicate loading status
      $('.segment').addClass('loading');
      getHistoricalRates();
      // prevent page from submitting to server
      return false;
    }
    return true;
  };

  router.add('/historical', () => {
    const html = historicalTemplate();
    el.html(html);

    // activate date picker
    $('#calendar').calendar({
      type: 'date',
      formatter: { //format date to yyyy-mm-dd
        date: date => new Date(date).toISOString().split('T')[0],
      },
    });

    // Validate Date input
    $('.ui.form').form({
      fields: {
        date: 'empty',
      },
    });
    $('.submit').click(historicalRatesHandler);
  });

  // navigate app to current url
  router.navigateTo(window.location.pathname);

  // Highlight active menu or refresh/page reload
  const link = $(`a[href$='${window.location.pathname}']`);
  link.addClass('active');

  $('a').on('click', (event) => {
    //Block browser page load
    event.preventDefault();

    // Highlight Active Menu on click
    const target = $(event.target);
    $('.item').removeClass('active');
    target.addClass('active');

    // Navigate to clicked url
    const href = target.attr('href');
    const path = href.substr(href.lastIndexOf('/'));
    router.navigateTo(path);
  });
});
