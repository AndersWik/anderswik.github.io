---
layout: post
title:  Magento Google Dynamic Display Ads.
date:   2015-02-29 22:30:00
categories: Magento
---
Add Google Dynamic Display Ad's in Magento. Instead of adding it with a module add it in your theme.


In our `local.xml`

{% highlight xml %}
<?xml version="1.0" encoding="UTF-8"?>
<layout>
  <default>
    <reference name="head">
      <!-- Google Dynamic Display Ads -->
      <block type="core/template" template="GoogleDDA/default.phtml" after="+"/>
    </reference>
  </default>
</layout>
{% endhighlight %}


In our `template/GoogleDDA/default.xml`

{% highlight php %}
<!--
===============================================================
=================  Google Dynamic Display Ads  ================
===============================================================
-->
<?php
$ecomm_pagetype = 'other';
$ecomm_prodid = '""';
$ecomm_totalvalue = '""';

// $x = $this->getRequest()->getControllerName();
// echo $x;

switch ($this->getRequest()->getControllerName()) {
  case 'result':
  //searchresults
  $ecomm_pagetype = 'searchresults';
  $product_collection = Mage::getSingleton('catalogsearch/advanced')->getProductCollection();
  $product_ids = array();
  $ecomm_totalvalue = 0;
  foreach ($product_collection as $prod_id) {
    //$product_ids[] = '"' . $prod_id->getEntityId() . '"';
    $sku = Mage::getModel('catalog/product')->load($prod_id->getEntityId())->getSku();
    $product_ids[] = '"' . $sku . '"';
    $ecomm_totalvalue += $prod_id->getFinalPrice();
  }

  $ecomm_prodid = '[' . implode(',', $product_ids) . ']';
  break;
  case 'category':
  //category
  $ecomm_pagetype = 'category';
  if ($category = Mage::registry('current_category')) {
    $product_collection = $category->getProductCollection()->addFinalPrice();
    $product_ids = array();
    $ecomm_totalvalue = 0;
    foreach ($product_collection as $prod_id) {
      //$product_ids[] = '"' . $prod_id->getEntityId() . '"';
      $sku = Mage::getModel('catalog/product')->load($prod_id->getEntityId())->getSku();
      $product_ids[] = '"' . $sku . '"';
      $ecomm_totalvalue += $prod_id->getFinalPrice();
    }
  }

  $ecomm_prodid = '[' . implode(',', $product_ids) . ']';
  break;
  case 'product':
  //product
  $ecomm_pagetype = 'product';
  if ($product = Mage::registry('current_product')) {
    $ecomm_prodid = Mage::registry('current_product')->getSku();
    $ecomm_totalvalue = Mage::registry('current_product')->getPrice();
  }

  break;
  case 'cart':
  case 'checkout_onepage':
  case 'checkout':
  //cart, purchase
  if ($this->getRequest()->getControllerName() == 'cart') {
    $ecomm_pagetype = 'cart';
  } else {
    $ecomm_pagetype = 'purchase';
  }

  $ecomm_prodid = '';
  $ecomm_totalvalue = Mage::helper('checkout/cart')->getQuote()->getGrandTotal();
  $visible_items = Mage::helper('checkout/cart')->getQuote()->getAllVisibleItems();
  $product_ids = array();
  foreach ($visible_items as $prod_id) {
    $product_ids[] = '"' . $prod_id->getSku() . '"';
  }

  $ecomm_prodid = '[' . implode(',', $product_ids) . ']';
  break;
  case 'index':
  //home
  if ($this->getRequest()->getRouteName() == 'cms') {
    $ecomm_pagetype = 'home';
  }
  default:
  //other
  if ($this->getRequest()->getRouteName() != 'cms') {
    $ecomm_pagetype = 'other';
  }

  $ecomm_prodid = '""';
  $ecomm_totalvalue = '""';
}
?>

<script type="text/javascript">
var google_tag_params = {
  ecomm_prodid: '<?php echo $ecomm_prodid; ?>', (=SKU)
  ecomm_pagetype: '<?php echo $ecomm_pagetype; ?>',
  ecomm_totalvalue: '<?php echo $ecomm_totalvalue; ?>',
};
</script>
{% endhighlight %}
