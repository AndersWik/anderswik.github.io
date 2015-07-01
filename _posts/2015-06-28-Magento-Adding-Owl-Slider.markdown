---
layout: post
title:  Adding OWL Carousel To Magento
date:   2015-06-28 22:30:00
categories: Magento
---

To add a slider to our Magento store we can use one of the free modules from [Magento Connect][MagentoConnect]. But there are benefits to adding the slider to your theme. The main one is that you can use any slider you want. We are going to use OWL Carousel.

<!-- Important Owl stylesheet -->
<link rel="stylesheet" href="/assets/owl-carousel/owl.carousel.css">
<!-- Default Theme -->
<link rel="stylesheet" href="/assets/owl-carousel/owl.theme.css">
<!--  jQuery 1.11.3  -->
<script src="/assets/jquery/jquery-1.11.3.min.js"></script>
<!-- Include js plugin -->
<script src="/assets/owl-carousel/owl.carousel.js"></script>

<div id="owl-demo" class="owl-carousel owl-theme">
  <div class="item"><img src="/assets/images/fullimage1.jpg" alt="img1"></div>
  <div class="item"><img src="/assets/images/fullimage2.jpg" alt="img2"></div>
  <div class="item"><img src="/assets/images/fullimage3.jpg" alt="img3"></div>
  <div class="item"><img src="/assets/images/fullimage4.jpg" alt="img3"></div>
</div>

<style>
#owl-demo .item img{
    display: block;
    width: 100%;
    height: auto;
}
</style>

<script>
$(document).ready(function() {
  $("#owl-demo").owlCarousel({
      navigation : true,
      slideSpeed : 300,
      paginationSpeed : 400,
      singleItem:true
  });
});
</script>

We start with adding a place for it. In the the layout you are using (I use `1column.phtml`) add the line `echo $this->getChildHtml('slider')` were we want to display the Owl-Carousel. A nice location is between the header and content.

{% highlight xml %}
<?php echo $this->getChildHtml('slider') ?>
{% endhighlight %}

In the `local.xml` we add a `core/text_list` block to be printed in the layout file.

{% highlight xml %}
<?xml version="1.0"?>
<layout version="0.1.0">
  <default translate="label">
    <reference name="root">
      <block type="core/text_list" name="slider" as="slider" translate="label">
        <label>slider</label>
      </block>
    </reference>
  </default>
</layout>
{% endhighlight %}

Next we add the Jquery and Owl files to our Magento installation. First dowload [Jquery][jquery] and [Owl-carousel][owl]. Then create a folder called `jquery` and one folder called `owl-carousel` in the following directory `skin/frontend/base/default`. In the `jquery` folder put two files, `jquery-2.1.3.min.js` and `noconflict.js`. The `noconflict.js` should only containes one line `$.noConflict();`. In the dowloaded owl folder take all files from the `owl-carousel` directory and put it in the `owl-carousel` directory in your Magento installation. Now we can add JQuery and the Owl to our page. In `local.xml` type the following.

{% highlight xml %}
<reference name="head">
      <!--Adding JQuery -->
      <action method="addItem">
        <type>skin_js</type>
        <name>jquery/jquery-2.1.3.min.js</name>
      </action>
      <action method="addItem">
        <type>skin_js</type>
        <name>jquery/noconflict.js</name>
      </action>
      <!--Adding Owl -->
      <action method="addItem">
        <type>skin_css</type>
        <name>owl-carousel/owl.carousel.css</name>
      </action>
      <action method="addItem">
        <type>skin_css</type>
        <name>owl-carousel/owl.theme.css</name>
      </action>
      <action method="addItem">
        <type>skin_js</type>
        <name>owl-carousel/owl.carousel.js</name>
      </action>
</reference>
{% endhighlight %}

Next we need to add a template file with the Owl code on the pages where we want too display the carousel. We are only going to show the carousel on the CMS home page. In the `local.xml` type the following.

{% highlight xml %}
  <cms_index_index>
    <reference name="slider">
      <block type="core/template" name="slider-home" template="slider/slider.phtml">
        <block type="cms/block" name="home_slider">
          <action method="setBlockId">
            <block_id>home_slider</block_id>
          </action>
        </block>
      </block>
    </reference>
</cms_index_index>
{% endhighlight %}

You really only need to add the template file now but we also add a cms block for later. In the `slider/slider.phtml` file we add a div for the carousel and some content for the slider. Don't forget to add some images in the media folder. The path below is `media/slider/file.jpg`.

{% highlight html %}
<div id="mwd-owl" class="owl-carousel owl-theme">

  <div class="item"><img src="<?php //echo Mage::getBaseUrl(Mage_Core_Model_Store::URL_TYPE_MEDIA).'/slider/ex1.jpg'; ?>" alt="mwd1"></div>
  <div class="item"><img src="<?php //echo Mage::getBaseUrl(Mage_Core_Model_Store::URL_TYPE_MEDIA).'/slider/ex2.jpg'; ?>" alt="mwd2"></div>
  <div class="item"><img src="<?php //echo Mage::getBaseUrl(Mage_Core_Model_Store::URL_TYPE_MEDIA).'/slider/ex3.jpg'; ?>" alt="mwd3"></div>
  <div class="item"><img src="<?php //echo Mage::getBaseUrl(Mage_Core_Model_Store::URL_TYPE_MEDIA).'/slider/ex4.jpg'; ?>" alt="mwd4"></div>

</div>
{% endhighlight %}


Now we need to add some jQuery. Also add the script below in the `slider.phtml` template file and then you are done. You have a working slider.

{% highlight html %}
<script>
jQuery( document ).ready(function( $ ) {

  var owl = $("#example-owl");

  owl.owlCarousel({
    navigation : false,
    slideSpeed : 300,
    paginationSpeed : 400,
    singleItem:true,
    autoPlay: true,
    stopOnHover: true
  });

});
</script>
{% endhighlight %}

A nice thing is to be able to change the content of the slider in the Magento admin. In our Magento admin we can creat a static block and type the content of the slider there. Create a static block called "home_slider" and replace the content of the "example-owl" div with echo `$this->getChildHtml('home_slider')`.

{% highlight html %}
<div id="example-owl" class="owl-carousel owl-theme">
  <?php echo $this->getChildHtml('home_slider'); ?>
</div>
{% endhighlight %}



[MagentoConnect]:http://www.magentocommerce.com/magento-connect/
[owl]:http://owlgraphic.com/owlcarousel/
[jquery]:https://jquery.com
