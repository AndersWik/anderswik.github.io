---
layout: post
title:  Magento Developer Certification Catalog and Product Types
date:   2016-11-26 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Catalog and Product Types`.


7 - Catalog
====================

Product Types
--------------------

### Identify and describe standard product types (simple, configurable, bundled, etc.).

* Bundle: Several simple items that can be bought as one item. This is useful for products where several configurations are available.
* Configurable: One item that enables the customer to configure the product. Example, the customer want a T-shirt. The t-shirt is available in three sizes, small, medium and large. Each size is an individual simple product. These three simple products are set as child products to the configurable product. Now the customer views the three products as one and select the size and add the product from the configurable product.
* Downloadable: This product is not a physical product. Instead it can be downloaded. Examples would be pdfs or mp3s. The files can be uploaded thru Magentos admin or added by urls.
* Grouped: This is a package of several simple items. The customer can select the quantity of each item.
* Virtual: This product is not a physical product. This might be a service.
* Simple: This is one single product with one single configuration. Example T-shirt, size: large.

### Create custom product types from scratch or modify existing product types.

{% highlight xml %}
<config>
 <modules>
  <My_Module>
   <active>true</active>
   <codePool>community</codePool>
  </My_Module>
 </modules>
</config>
{% endhighlight %}

{% highlight xml %}
<config>
 <modules>
  <My_Module>
   <version>1.0.0.0</version>
  </My_Module>
 </modules>
 <global>
  <helpers>
   <mymodule>
    <class>My_Module_Helper</class>
   </mymodule>
  </helpers>
  <models>
   <mymodule>
    <class>My_Module_Model</class>
   </mymodule>
  </models>
  <catalog>
   <product>
    <type>
     <myproduct translate="label" module="my_module">
      <label>My Product</label>
      <model>mymodule/product</model>
      <composite>1</composite>
      <index_priority></index_priority>
     </myproduct>
    </type>
   </product>
  </catalog>
 </global>
</config>
{% endhighlight %}

{% highlight php %}
<?php
class My_Module_Model_Product extends Mage_Catalog_Model_Product_Type_Configurable
{

}
{% endhighlight %}

{% highlight php %}
<?php
class My_Module_Helper_Data extends Mage_Core_Helper_Abstract
{

}
{% endhighlight %}

### Identify how custom product types interact with indexing, SQL, and underlying data structures.



### In addition to allowing customization of existing product types, the framework provided by the Magento catalog module lets you create completely new ones.

#### Which product types exist in Magento?

* Simple
* Configurable
* Grouped
* Virtual
* Bundle
* Downloadable

#### Which product types are implemented as part of the Mage_Catalog module, and which are not?

4 product types are implemented as part of the Mage_Catalog module

* Simple
* Configurable
* Grouped
* Virtual

2 product types are not implemented as part of the Mage_Catalog module

* Bundle
* Downloadable

#### What steps need to be taken in order to implement a custom product type?

Create a new module and add the new product in `etc/config.xml`. Then add a new model that extends an existing product type or [Mage_Catalog_Model_Product_Type_Abstract][Mage_Catalog_Model_Product_Type_Abstract].

{% highlight xml %}
<global>
 <catalog>
  <product>
   <type>
    <{name}>
     <label></label>
     <model></model>
     <composite></composite>
     <index_priority></index_priority>
     <price_model></price_model>
     <allow_product_types></allow_product_types>
    </{name}>
   </type>
  </product>
 </catalog>
</global>
{% endhighlight %}

* Label is the label of the product.
* Model is the product module of the module. This will extend an existing product or [Mage_Catalog_Model_Product_Type_Abstract][Mage_Catalog_Model_Product_Type_Abstract]
* Composite is a boolean value (1 or 0). This defines the product is a Composite product. Example of composite products are [Configurable][Mage_Catalog_Model_Product_Type_Configurable], [Grouped][Mage_Catalog_Model_Product_Type_Grouped] and [Bundled][Mage_Bundle_Model_Product_Type].
* Index Priority
* Price Model is the model that calculates the price.
* What child products that are allowed. This only effects composite products.

#### How do the different product types handle calculation?

Product types can define their own pricing model. It is this model that calculates the price.

#### Which indexing processes does the product type influence?

The product price (`catalog_product_index_price_*`).

#### Which product types implement a parent-child relationship between product entities?

All composite product types.
* Configurable
* Grouped
* Bundle

#### Which database tables are shared between product types, and which ones are specific to one product type?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Catalog_Model_Product_Type][Mage_Catalog_Model_Product_Type]
* [Mage_Catalog_Model_Product_Type_Abstract][Mage_Catalog_Model_Product_Type_Abstract]
* [Mage_Catalog_Model_Product_Type_Simple][Mage_Catalog_Model_Product_Type_Simple]
* [Mage_Catalog_Model_Resource_Product_Type_Configurable][Mage_Catalog_Model_Resource_Product_Type_Configurable]
* [Mage_Bundle_Model_Product_Type][Mage_Bundle_Model_Product_Type]


#### Additional Readings

* [Magecert.com: Catalog][magecert.catalog]
* [Nathan McBride: Product Types][brideo.product-types]
* [Solving Magento: Creating a Custom Product Type][divisionlab.custom-product]


[magecert.catalog]:http://magecert.com/catalog.html
[brideo.product-types]:http://brideo.co.uk/magento-certification-notes/catalog/Product-Types/
[divisionlab.custom-product]:http://www.divisionlab.com/solvingmagento/creating-a-custom-product-type-in-magento/


[Mage_Catalog_Model_Product_Type]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product/Type.php
[Mage_Catalog_Model_Product_Type_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product/Type/Abstract.php
[Mage_Catalog_Model_Product_Type_Simple]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product/Type/Simple.php
[Mage_Catalog_Model_Resource_Product_Type_Configurable]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Resource/Product/Type/Configurable.php
[Mage_Catalog_Model_Product_Type_Configurable]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product/Type/Configurable.php
[Mage_Catalog_Model_Product_Type_Grouped]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product/Type/Grouped.php
[Mage_Bundle_Model_Product_Type]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Bundle/Model/Product/Type.php
