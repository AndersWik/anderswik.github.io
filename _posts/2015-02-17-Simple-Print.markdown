---
layout: post
title:  Simple Print
date:   2015-02-17 22:30:00
categories: Javascript
---

Two simple ways to print a div and exclude parts of the content before printing.

<div id="print-div" style="border-style: dashed; margin:5px; border-width: 5px;">

<p style="text-align:center; font-weight:600;">A Div With the ID "print-div"</p>

<p style="padding:5px; font-weight:600; background-color:green; text-align:center;">Print Me</p>

<p id="no" style="padding:5px; font-weight:600; background-color:red; text-align:center;">Do Not Print Me With the ID "no"</p>

<p style="padding:5px; font-weight:600; background-color:green; text-align:center;">Print Me</p>

</div>


<script type="text/javascript">
function printMe1(area) {;
  var printContents = document.getElementById(area).innerHTML;
  var popupWin = window.open('', '_blank', 'width=400,height=400');
  popupWin.document.open();
  popupWin.document.write('<html><body onload="window.print()">' + printContents + '</html>');
  popupWin.document.close();
}
</script>

<a href="javascript:printMe1('print-div');" title="Print Me!">Print Me!</a>

{% highlight bash %}
<script type="text/javascript">
function printMe1(area) {;
  var printContents = document.getElementById(area).innerHTML;
  var popupWin = window.open('', '_blank', 'width=400,height=400');
  popupWin.document.open();
  popupWin.document.write('<html><body onload="window.print()">' + printContents + '</html>');
  popupWin.document.close();
}
</script>

<a href="javascript:printMe1('print-div');" title="Print Me!">Print Me!</a>
{% endhighlight %}




<script type="text/javascript">
function printMe2(area) {
  var originalContents = document.body.innerHTML;

  var elem = document.getElementById("no");
  elem.parentNode.removeChild(elem);

  var printContents = document.getElementById(area).innerHTML;
  var popupWin = window.open('', '_blank', 'width=400,height=400');
  popupWin.document.open();
  popupWin.document.write('<html><body onload="window.print()">' + printContents + '</html>');
  popupWin.document.close();
  document.body.innerHTML = originalContents;
}
</script>

<a href="javascript:printMe2('print-div');" title="Print Me!">Do Not Print Me!</a>




{% highlight bash %}
<script type="text/javascript">
function printMe2(area) {
  var originalContents = document.body.innerHTML;

  var elem = document.getElementById("no");
  elem.parentNode.removeChild(elem);

  var printContents = document.getElementById(area).innerHTML;
  var popupWin = window.open('', '_blank', 'width=400,height=400');
  popupWin.document.open();
  popupWin.document.write('<html><body onload="window.print()">' + printContents + '</html>');
  popupWin.document.close();
  document.body.innerHTML = originalContents;
}
</script>

<a href="javascript:printMe2('print-div');" title="Print Me!">Do Not Print Me!</a>
{% endhighlight %}





<script type="text/javascript">
function printMe3(area) {
     var printContents = document.getElementById(area).innerHTML;
     var originalContents = document.body.innerHTML;

     document.body.innerHTML = printContents;
     window.print();
     document.body.innerHTML = originalContents;
}
</script>

<a href="javascript:printMe3('print-div');" title="Print Me 3!">Print Me 2!</a>

{% highlight bash %}
<script type="text/javascript">
function printMe3(area) {
     var printContents = document.getElementById(area).innerHTML;
     var originalContents = document.body.innerHTML;

     document.body.innerHTML = printContents;
     window.print();
     document.body.innerHTML = originalContents;
}
</script>

<a href="javascript:printMe3('print-div');" title="Print Me 3!">Print Me 2!</a>
{% endhighlight %}


<script type="text/javascript">
function printMe4(area) {
     var printContents = document.getElementById(area).innerHTML;
     var originalContents = document.body.innerHTML;

     document.body.innerHTML = printContents;

     var elem = document.getElementById("no");
     elem.parentNode.removeChild(elem);

     window.print();

     document.body.innerHTML = originalContents;
}
</script>

<a href="javascript:printMe4('print-div');" title="Print Me 4!">Do Not Print Me 2!</a>

{% highlight bash %}
<script type="text/javascript">
function printMe4(area) {
     var printContents = document.getElementById(area).innerHTML;
     var originalContents = document.body.innerHTML;

     document.body.innerHTML = printContents;
     var elem = document.getElementById("no");
     elem.parentNode.removeChild(elem);

     window.print();
     document.body.innerHTML = originalContents;
}
</script>

<a href="javascript:printMe4('print-div');" title="Print Me 4!">Do Not Print Me 2!</a>
{% endhighlight %}



[l1]:http://www.quirksmode.org/js/popup.html

[l2]:http://stackoverflow.com/questions/468881/print-div-id-printarea-div-only

[l3]:http://pranaydac08.blogspot.se/2013/01/magento-how-to-print-div-content-only.html
