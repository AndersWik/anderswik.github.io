---
layout: post
title:  Magento Developer Certification Working with Databases in Magento and Models, resource models, and collections
date:   2016-11-19 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Working with Databases in Magento and Models, resource models, and collections`.

4 - Working with Databases in Magento
====================

Models, resource models, and collections
--------------------

### Describe the basic concepts of models, resource models, and collections, and the relationship they have to one another

Models contain business logic and get data from the database. The models do not directly connect to the database. The models resource (modelResource) read from and write to the database.

The collection extends [Mage_Core_Model_Resource_Db_Collection_Abstract][Mage_Core_Model_Resource_Db_Collection_Abstract] that in turn extends [Varien_Data_Collection_Db][Varien_Data_Collection_Db] that extends [Varien_Data_Collection][Varien_Data_Collection] that implements php's [Varien_Data_Collection::getIterator][Varien_Data_Collection::getIterator]. In the [Varien_Data_Collection][Varien_Data_Collection] all objects are stored in an array. This is what makes us able to loop thru the collection.

{% highlight php %}
`<?php
class Varien_Data_Collection implements IteratorAggregate, Countable
{
 protected $_items = array();

 public function getIterator()
 {
  $this->load();
  return new ArrayIterator($this->_items);
 }
}`
{% endhighlight %}

To add our own model, collection and table to the database we need the following files.

* `app/code/community/My/Module/etc/config.xml`

{% highlight xml %}
<?xml version="1.0"?>
<config>
    <modules>
        <My_Module>
            <version>0.1.0</version>
        </My_Module>
    </modules>
    <global>
        <models>
            <notes>
                <class>My_Module_Model</class>
                <resourceModel>notes_resource</resourceModel>
            </notes>
            <notes_resource>
                <class>My_Module_Model_Resource</class>
                <entities>
                    <note>
                        <table>my_module_note</table>
                    </note>
                </entities>
            </notes_resource>
        </models>
        <resources>
            <my_module_setup>
                <setup>
                    <module>My_Module</module>
                </setup>
            </my_module_setup>
        </resources>
    </global>
</config>
{% endhighlight %}

* `app/code/community/My/Module/Model/Note.php`
* [Mage_Core_Model_Abstract][Mage_Core_Model_Abstract]

{% highlight php %}
`<?php
class My_Module_Model_Note extends Mage_Core_Model_Abstract
{
    protected $_eventPrefix = 'notes_note';

    protected function _construct()
    {
        $this->_init('notes/note');
    }
}`
{% endhighlight %}

* `app/code/community/My/Module/Model/Resource/Note.php`
* [Mage_Core_Model_Resource_Db_Abstract][Mage_Core_Model_Resource_Db_Abstract]
* [Mage_Core_Model_Resource_Abstract][Mage_Core_Model_Resource_Abstract]

{% highlight php %}
`<?php
class My_Module_Model_Resource_Note extends Mage_Core_Model_Resource_Db_Abstract
{
    protected function _construct()
    {
        $this->_init('notes/note', 'note_id');
    }

}`
{% endhighlight %}

* `app/code/community/My/Module/Model/Resource/Note/Collection.php`
* [Mage_Core_Model_Resource_Db_Collection_Abstract][Mage_Core_Model_Resource_Db_Collection_Abstract]
* [Varien_Data_Collection_Db][Varien_Data_Collection_Db]
* [Varien_Data_Collection][Varien_Data_Collection]

{% highlight php %}
<?php
class My_Module_Model_Resource_Note_Collection
  extends Mage_Core_Model_Resource_Db_Collection_Abstract
{
}
{% endhighlight %}

* `app/code/community/My/Module/sql/my_module_setup/install-0.1.0.php`

{% highlight php %}
<?php
$installer = $this;
$installer->startSetup();

$table = $installer->getConnection()
    ->newTable($installer->getTable('notes/note'))
    ->addColumn('note_id', Varien_Db_Ddl_Table::TYPE_INTEGER, null, array(
        'identity'  => true,
        'nullable'  => false,
        'primary'   => true,
    ), 'Note ID')
    ->addColumn('creation_time', Varien_Db_Ddl_Table::TYPE_TIMESTAMP, null, array(
    ), 'Note Creation Time')
    ->addColumn('update_time', Varien_Db_Ddl_Table::TYPE_TIMESTAMP, null, array(
    ), 'Note Modification Time')
    ->addColumn('content', Varien_Db_Ddl_Table::TYPE_TEXT, '2M', array(
    ), 'Note Content')
    ->addColumn('title', Varien_Db_Ddl_Table::TYPE_TEXT, 255, array(
        'nullable'  => true
    ), 'Note Title')
    ->setComment('Note Table');

$installer->getConnection()->createTable($table);
$installer->endSetup();
{% endhighlight %}

* [Mage_Core_Model_Resource_Setup][Mage_Core_Model_Resource_Setup]
* [Varien_Db_Ddl_Table][Varien_Db_Ddl_Table]

### Configure a database connection

* [app/etc/local.xml][app/etc/local.xml]

{% highlight xml %}
<config>
    <global>
        <install>
            <date>{{date}}</date>
        </install>
        <crypt>
            <key>{{key}}</key>
        </crypt>
        <disable_local_modules>false</disable_local_modules>
        <resources>
            <db>
                <table_prefix>{{db_prefix}}</table_prefix>
            </db>
            <default_setup>
                <connection>
                    <host>{{db_host}}</host>
                    <username>{{db_user}}</username>
                    <password>{{db_pass}}</password>
                    <dbname>{{db_name}}</dbname>
                    <initStatements>{{db_init_statemants}}</initStatements>
                    <model>{{db_model}}</model>
                    <type>{{db_type}}</type>
                    <pdoType>{{db_pdo_type}}</pdoType>
                    <active>1</active>
                </connection>
            </default_setup>
        </resources>
        <session_save>{{session_save}}</session_save>
    </global>
    <admin>
        <routers>
            <adminhtml>
                <args>
                    <frontName>{{admin_frontname}}</frontName>
                </args>
            </adminhtml>
        </routers>
    </admin>
</config>
{% endhighlight %}

* [app/etc/config.xml][app/etc/config.xml]

### Describe how Magento works with database tables

* `/etc/config.xml`

{% highlight xml %}
<notes_resource>
    <class>My_Module_Model_Resource</class>
    <entities>
        <note>
            <table>my_module_note</table>
        </note>
    </entities>
</notes_resource>
{% endhighlight %}

### Describe the load-and-save process for a regular entity

[Mage_Core_Model_Abstract::save()]:[Mage_Core_Model_Abstract::save]

{% highlight php %}
`<?php
public function save()
{
 /**
 * Direct deleted items to delete method
 */
 if ($this->isDeleted()) {
  return $this->delete();
 }
 if (!$this->_hasModelChanged()) {
  return $this;
 }
 $this->_getResource()->beginTransaction();
 $dataCommited = false;
 try {
  $this->_beforeSave();
  if ($this->_dataSaveAllowed) {
   $this->_getResource()->save($this);
   $this->_afterSave();
  }
  $this->_getResource()->addCommitCallback(array($this, 'afterCommitCallback'))
                ->commit();
  $this->_hasDataChanges = false;
  $dataCommited = true;
 } catch (Exception $e) {
  $this->_getResource()->rollBack();
  $this->_hasDataChanges = true;
  throw $e;
 }
 if ($dataCommited) {
  $this->_afterSaveCommit();
 }
 return $this;
}`
{% endhighlight %}

[Mage_Core_Model_Abstract::load()][Mage_Core_Model_Abstract::load]

{% highlight php %}
`<?php
public function load($id, $field=null)
{
 $this->_beforeLoad($id, $field);
 $this->_getResource()->load($this, $id, $field);
 $this->_afterLoad();
 $this->setOrigData();
 $this->_hasDataChanges = false;
 return $this;
}`
{% endhighlight %}

### Describe group save operations

The group save operations is a database transaction. This means that we add several statements and try to execute all at the same time. This allows us to rollback all statements if one statement fail.
You start a transaction add several statements and commit it when everything has run successfully. If the transaction fails it will not commit and everything will be rolled back. Magento use transactions when saving models.

{% highlight php %}
<?php
$transaction = Mage::getModel('core/resource_transaction');
$transaction->addObject($object1);
$transaction->addObject($object2);
$transaction->addObject($object3);
$transaction->save();
{% endhighlight %}

### Describe the role of Zend_Db_Select in Magento

[Zend_Db_Select][Zend_Db_Select]

### Describe the collection interface (filtering/sorting/grouping)

### Describe the hierarchy of database-related classes in Magento


* [Mage_Core_Model_Abstract][Mage_Core_Model_Abstract]

* [Mage_Core_Model_Resource_Db_Abstract][Mage_Core_Model_Resource_Db_Abstract]
* [Mage_Core_Model_Resource_Abstract][Mage_Core_Model_Resource_Abstract]

* [Mage_Core_Model_Resource_Db_Collection_Abstract][Mage_Core_Model_Resource_Db_Collection_Abstract]
* [Varien_Data_Collection_Db][Varien_Data_Collection_Db]
* [Varien_Data_Collection][Varien_Data_Collection]

### Describe the role and hierarchy of setup objects in Magento

#### These objectives fall into two broad areas. The first is about how models work with resource models and collections in order to access the database storage layer; the second is about how to work with the database directly by using the adapter classes and the Zend_Db_Select object to create queries.

#### Which methods exist to access the table of a resource model?



#### Which methods exist to create joins between tables on collections and on select instances?

[Zend_Db_Select][Zend_Db_Select]

* [Zend_Db_Select::join()][Zend_Db_Select::join]
* [Zend_Db_Select::joinInner()][Zend_Db_Select::joinInner]
* [Zend_Db_Select::joinLeft()][Zend_Db_Select::joinLeft]
* [Zend_Db_Select::joinRight()][Zend_Db_Select::joinRight]
* [Zend_Db_Select::joinFull()][Zend_Db_Select::joinFull]
* [Zend_Db_Select::joinCross()][Zend_Db_Select::joinCross]
* [Zend_Db_Select::joinNatural()][Zend_Db_Select::joinNatural]

#### How does Magento support different RDBMSs?

* [app/etc/local.xml][app/etc/local.xml]
* [app/etc/config.xml][app/etc/config.xml]

{% highlight xml %}
<type><![CDATA[pdo_mysql]]></type>
{% endhighlight %}


#### How do table name lookups work, and what is the purpose of making table names configurable?

* `/etc/config.xml`

{% highlight xml %}
<notes_resource>
    <class>My_Module_Model_Resource</class>
    <entities>
        <note>
            <table>my_module_note</table>
        </note>
    </entities>
</notes_resource>
{% endhighlight %}

* `Mage::getModel('core/resource')->getTableName('catalog/product')`
* `Mage::getSingleton('core/resource')->getTableName('catalog/product')`

#### Which events are fired automatically during CRUD operations?

[Mage_Core_Model_Abstract::_beforeLoad()][Mage_Core_Model_Abstract::_beforeLoad]

{% highlight php %}
`<?php
abstract class Mage_Core_Model_Abstract extends Varien_Object
{
 protected $_eventPrefix = 'core_abstract';

 protected function _beforeLoad($id, $field = null)
 {
  $params = array('object' => $this, 'field' => $field, 'value'=> $id);
  Mage::dispatchEvent('model_load_before', $params);
  $params = array_merge($params, $this->_getEventData());
  Mage::dispatchEvent($this->_eventPrefix.'_load_before', $params);
  return $this;
 }
 }`
 {% endhighlight %}

[Mage_Core_Model_Abstract::_afterLoad()][Mage_Core_Model_Abstract::_afterLoad]

 {% highlight php %}
 `<?php
 abstract class Mage_Core_Model_Abstract extends Varien_Object
 {
 protected function _afterLoad()
 {
  Mage::dispatchEvent('model_load_after', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_load_after', $this->_getEventData());
  return $this;
 }
}`
{% endhighlight %}


Magento will throw four events. Two before and two after.
We can override the `$_eventPrefix` in our custom model. Then two events with the modules name are fired automatically. If we do not override the `$_eventPrefix` variable `core_abstract` will be used by default.

* `core_abstract_load_before`
* `core_abstract_load_after`

[Mage_Core_Model_Abstract::_beforeSave()][Mage_Core_Model_Abstract::_beforeSave]

{% highlight php %}
`<?php
abstract class Mage_Core_Model_Abstract extends Varien_Object
{
 protected function _beforeSave()
 {
  if (!$this->getId()) {
   $this->isObjectNew(true);
  }
  Mage::dispatchEvent('model_save_before', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_save_before', $this->_getEventData());
  return $this;
 }
}`
{% endhighlight %}

[Mage_Core_Model_Abstract::_afterSave()][Mage_Core_Model_Abstract::_afterSave]

{% highlight php %}
`<?php
abstract class Mage_Core_Model_Abstract extends Varien_Object
{
 protected function _afterSave()
 {
  $this->cleanModelCache();
  Mage::dispatchEvent('model_save_after', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_save_after', $this->_getEventData());
  return $this;
 }
}`
{% endhighlight %}

* `core_abstract_save_before`
* `core_abstract_save_after`

[Mage_Core_Model_Abstract::_beforeDelete()][Mage_Core_Model_Abstract::_beforeDelete]

{% highlight php %}
`<?php
abstract class Mage_Core_Model_Abstract extends Varien_Object
{
 protected function _beforeDelete()
 {
  Mage::dispatchEvent('model_delete_before', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_delete_before', $this->_getEventData());
  $this->cleanModelCache();
  return $this;
 }
}`
{% endhighlight %}

[Mage_Core_Model_Abstract::_afterDelete()][Mage_Core_Model_Abstract::_afterDelete]

{% highlight php %}
`<?php
abstract class Mage_Core_Model_Abstract extends Varien_Object
{
 protected function _afterDelete()
 {
  Mage::dispatchEvent('model_delete_after', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_delete_after', $this->_getEventData());
  return $this;
 }
}`
{% endhighlight %}

* `core_abstract_delete_before`
* `core_abstract_delete_after`

[Mage_Core_Model_Abstract::afterCommitCallback][Mage_Core_Model_Abstract::afterCommitCallback]

{% highlight php %}
`<?php
abstract class Mage_Core_Model_Abstract extends Varien_Object
{
 public function afterCommitCallback()
 {
  Mage::dispatchEvent('model_save_commit_after', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_save_commit_after', $this->_getEventData());
  return $this;
 }
}`
{% endhighlight %}

[Mage_Core_Model_Abstract::_afterDeleteCommit][Mage_Core_Model_Abstract::_afterDeleteCommit]

{% highlight php %}
`<?php
abstract class Mage_Core_Model_Abstract extends Varien_Object
{
 protected function _afterDeleteCommit()
 {
  Mage::dispatchEvent('model_delete_commit_after', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_delete_commit_after', $this->_getEventData());
  return $this;
 }
}`
{% endhighlight %}

* `core_abstract_save_commit_after`
* `core_abstract_delete_commit_after`


#### How does Magento figure out if a save() call needs to create an INSERT or an UPDATE query?



#### How many ways exist to specify filters on a flat table collection?



#### Which methods exist to influence the ordering of the result set for flat table collections? How do the methods differ?

#### Why and how does Magento differentiate between setup, read, and write database resources?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Model_Abstract][Mage_Core_Model_Abstract]
* [Mage_Core_Model_Resource_Db_Abstract][Mage_Core_Model_Resource_Db_Abstract]
* [Mage_Core_Model_Resource_Db_Collection_Abstract][Mage_Core_Model_Resource_Db_Collection_Abstract]
* [Mage_Core_Model_Resource::getTableName()][Mage_Core_Model_Resource::getTableName]
* [Zend_Db_Select][Zend_Db_Select]

#### Additional Readings

* [Alan Storm: In Depth Magento Models ORM][alanstorm.models_orm]
* [Dev Docs: Part 8 — Varien Data Collections][devdocs.mage-for-dev-8]
* [Nathan McBride: Models, resource models, and collections][brideo.models]



[alanstorm.models_orm]:http://alanstorm.com/magento_models_orm/
[brideo.models]:http://brideo.co.uk/magento-certification-notes/working-with-databases-in-magento/Models,-Resource-Models,-and-Collections/
[devdocs.mage-for-dev-8]:http://devdocs.magento.com/guides/m1x/magefordev/mage-for-dev-8.html



[app/etc/local.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/etc/local.xml.template

[app/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/etc/config.xml

[Mage_Core_Model_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php

[Mage_Core_Model_Abstract::save]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php#L302

[Mage_Core_Model_Abstract::load]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php#L222

[Mage_Core_Model_Abstract::_beforeDelete]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php#L498

[Mage_Core_Model_Abstract::_afterDelete]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php#L426

[Mage_Core_Model_Abstract::_beforeLoad]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php#L250

[Mage_Core_Model_Abstract::_afterLoad]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php#L264

[Mage_Core_Model_Abstract::_beforeSave]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php#L385

[Mage_Core_Model_Abstract::_afterSave]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php#L462

[Mage_Core_Model_Abstract::afterCommitCallback]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php#L538

[Mage_Core_Model_Abstract::_afterDeleteCommit]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php#L538

[Mage_Core_Model_Resource_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Abstract.php

[Mage_Core_Model_Resource_Db_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Db/Abstract.php
[Mage_Core_Model_Resource_Db_Collection_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Db/Collection/Abstract.php
[Mage_Core_Model_Resource]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource.php
[Mage_Core_Model_Resource::getTableName]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource.php#L263

[Mage_Core_Model_Resource_Db_Collection_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Db/Collection/Abstract.php

[Mage_Core_Model_Resource_Setup]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Setup.php

[Varien_Data_Collection]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Data/Collection.php

[Varien_Data_Collection::getIterator]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Data/Collection.php#L739

[Varien_Data_Collection_Db]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Data/Collection/Db.php

[Varien_Db_Ddl_Table]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Db/Ddl/Table.php

[Zend_Db_Select]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Zend/Db/Select.php

[Zend_Db_Select::join]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Zend/Db/Select.php#L315

[Zend_Db_Select::joinInner]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Zend/Db/Select.php#L336

[Zend_Db_Select::joinLeft]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Zend/Db/Select.php#L357

[Zend_Db_Select::joinRight]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Zend/Db/Select.php#L379

[Zend_Db_Select::joinFull]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Zend/Db/Select.php#L401

[Zend_Db_Select::joinCross]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Zend/Db/Select.php#L418

[Zend_Db_Select::joinNatural]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Zend/Db/Select.php#L438

[Zend_Db_Select::joinNatural]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Zend/Db/Select.php#L438
