---
layout: post
title:  Magento Developer Certification Catalog and Catalog Price Rules
date:   2016-11-26 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Catalog and Catalog Price Rules`.


7- Catalog
===========

Catalog Price Rules
------------

### Identify how catalog price rules are implemented in Magento:

Catalog price rules are implemented in `Mage_CatalogRule`. The catalog price rules allows us to give a discount on products in selected categories. Or have different prices in the catalog depending on customer group. To add a new catalog price rule go to `Promotions > Catalog Price Rules > Add New Rule`. The rule looks like this.

* Rule Information
	* Rule Name `*`
	* Description
	* Status `*`
	* Customer Groups `*`
	* From Date
	* To Date
	* Priority
* Conditions
* Actions
	* Apply
	* Discount Amount `*`
	* Enable Discount to Subproducts
	* Stop Further Rules Processing

In the conditions tab we add the conditions for when the rules is applied. If the attribute we want to use for our rule dose not show in the dropdown go to, `Catalog > Attributes > Manage Attributes > {attribute}`. In the "Properties" tab got to "Frontend Properties" and set "Use for Promo Rule Conditions" to "Yes". The catalog price rules are stored in the following tables:

* `catalogrule`
* `catalogrule_affected_product`
* `catalogrule_customer_group`
* `catalogrule_group_website`
* `catalogrule_product`
* `catalogrule_product_price`
* `catalogrule_website`


We create an example rule. This rule will give a 50% discount on the product with the sku "534534501". The discount is for users that belong to the customer group "guest". The product "534534501" is a configurable product and we also want the discount to be applied to the child products.

* Rule Information
	* Rule Name: Some rule
	* Status: Active
	* Customer Groups: Guest
* Conditions
	* If ALL  of these conditions are TRUE : SKU  is  534534501
* Actions
	* Apply: By Percentage of the Original Price
	* Discount Amount: 50.0000
	* Enable Discount to Subproducts: Yes
	* Apply: By Percentage of the Original Price
	* Discount Amount: 50.0000
	* Stop Further Rules Processing: No

The rule is stored in the database like this,

* `catalogrule`

| rule_id | name      | description | from_date | to_date | is_active | conditions_serialized | actions_serialized | stop_rules_processing | sort_order  | simple_action | discount_amount | sub_is_enable | sub_simple_action | sub_discount_amount |
|---------|-----------|-------------|-----------|---------|-----------|-----------------------|--------------------|-----------------------|-------------|---------------|-----------------|---------------|-------------------|---------------------|
| 1       | Some Rule | NULL        | NULL      | NULL    | 1         | a:7:{s:4:"type";s:... | a:4:{s:4:"type"... | 0                     | 0           | by_percent    | 50.0000         | 1             | by_percent        | 50.0000             |

* `catalogrule_affected_product`

| product_id |
|------------|
| 1          |

* `catalogrule_customer_group`

| rule_id | customer_group_id |
|---------|-------------------|
| 1       | 0                 |

* `catalogrule_group_website`

| rule_id | customer_group_id | website_id |
|---------|-------------------|------------|
| 1       | 0                 | 1          |

* `catalogrule_product`

| rule_product_id | rule_id | from_time | to_time | customer_group_id | product_id | action_operator | action_amount | action_stop | sort_order | website_id | sub_simple_action | sub_discount_amount |
|-----------------|---------|-----------|---------|-------------------|------------|-----------------|---------------|-------------|------------|------------|-------------------|---------------------|
| 1               | 1       | 0         | 0       | 0                 | 63         | by_percent      | 50.0000       | 0           | 0          | 1          | by_percent        | 50.0000             |

* `catalogrule_product_price`

| rule_product_price_id | rule_date  | customer_group_id | product_id | rule_price | website_id | latest_start_date | earliest_end_date |
|-----------------------|------------|-------------------|------------|------------|------------|-------------------|-------------------|
| 1                     | 2016-12-15 | 0                 | 63         | 500.0000   | 1          | null              |  null             |

* `catalogrule_website`

| rule_id | website_id |
|---------|------------|
| 1       | 1          |

#### How are the catalog price rules related to the product prices?

Catalog Price Rules are applied to the product price in the catalog. We can use catalog price rules to change the price of all products in a category. The `Mage_CatalogRule` module observes the `catalog_product_get_final_price` event in its [config.xml][Mage/CatalogRule/etc/config.xml]. When `catalog_product_get_final_price` is dispatched [Mage_CatalogRule_Model_Observer::processFrontFinalPrice][Mage_CatalogRule_Model_Observer::processFrontFinalPrice] is called. `Mage_CatalogRule` modifies the price from this method.

{% highlight xml %}
<catalog_product_get_final_price>
 <observers>
  <catalogrule>
   <class>catalogrule/observer</class>
   <method>processFrontFinalPrice</method>
  </catalogrule>
 </observers>
</catalog_product_get_final_price>
{% endhighlight %}

#### How are the catalog price rules stored in the database?

* `catalogrule`
* `catalogrule_affected_product`
* `catalogrule_customer_group`
* `catalogrule_group_website`
* `catalogrule_product`
* `catalogrule_product_price`
* `catalogrule_website`

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_CatalogRule_Model_Rule][Mage_CatalogRule_Model_Rule]
* [Mage_CatalogRule_Model_Observer][Mage_CatalogRule_Model_Observer]
* [Mage_CatalogRule_Model_Rule_Product_Price][Mage_CatalogRule_Model_Rule_Product_Price]

#### Additional Readings

* [Magecert.com: Catalog][magecert.catalog]
* [Nathan McBride: Catalog Price Rules][brideo.product-types]
* [Solving Magento: Catalog Price Rules][divisionlab.catalog-price-rules]
* [Solving Magento: Catalog Price Rules Dont Work][divisionlab.catalog-price-rules-dont-work]



[magecert.catalog]:http://magecert.com/catalog.html
[brideo.product-types]:http://brideo.co.uk/magento-certification-notes/catalog/Catalog-Price-Rules/
[divisionlab.catalog-price-rules]:http://www.divisionlab.com/solvingmagento/magento-catalog-price-rules/
[divisionlab.catalog-price-rules-dont-work]:http://www.divisionlab.com/solvingmagento/quick-tip-magento-catalog-price-rules-dont-work/


[Mage/CatalogRule/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/CatalogRule/etc/config.xml
[Mage_CatalogRule_Model_Observer]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/CatalogRule/Model/Observer.php#L144
[Mage_CatalogRule_Model_Observer::processFrontFinalPrice]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/CatalogRule/Model/Observer.php#L144

[Mage_CatalogRule_Model_Rule]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/CatalogRule/Model/Rule.php
[Mage_CatalogRule_Model_Observer]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/CatalogRule/Model/Observer.php
[Mage_CatalogRule_Model_Rule_Product_Price]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/CatalogRule/Model/Rule/Product/Price.php
