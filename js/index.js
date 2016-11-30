/* global ga, URLSearchParams */
var domready = require('domready');

/* jshint ignore:start */
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){  // eslint-disable-line
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),    // eslint-disable-line
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)  // eslint-disable-line
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');  // eslint-disable-line
/* jshint ignore:end */

ga('create', 'UA-86987247-1', 'auto');
ga('send', 'pageview');

domready(() => {
  var hash = window.location.hash;
  var html = document.documentElement;
  var nav = document.querySelector('#nav');
  var navToggleAnchor = nav.querySelector('#nav-menu');
  var directory = require('./directory');

  var toggleNav = function (forceOpen) {
    var shouldOpenNav = forceOpen || !html.getAttribute('data-nav-open');
    html.setAttribute('data-nav-open', !!force);
  };

  if (hash === '#nav') {
    toggleNav(true);
  }

  window.addEventListener('hashchange', e => {
    // When the hamburger menu in the nav is clicked,
    // remove the `#nav` hash from the URL.
    hash = window.location.hash;
    if (hash === '#nav') {
      window.history.replaceState({}, document.title,
        window.location.pathname + window.location.search);
      toggleNav(true);
    }
  });

  var nav = document.querySelector('#nav-toggle');

  navToggleAnchor.addEventListener('click', e => {
    e.preventDefault();
    toggleNav();
  });

  if (window.location.pathname.indexOf('/directory') === 0) {
    directory.init();
  }
});
