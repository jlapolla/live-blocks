define $(d)template
$(eval include helpdoc.mk)
$(eval include watch.mk)
$(eval $(d)order := $(d)classes/getUndefined.js)
$(eval $(d)order += $(d)classes/extendClass.js)
$(eval $(d)order += $(d)classes/hasOwnProperty.js)
$(eval $(d)order += $(d)classes/multiInheritClass.js)
$(eval $(d)order += $(d)classes/ArrayIterator.js)
$(eval $(d)order += $(d)classes/Queue.js)
$(eval $(d)order += $(d)classes/Set.js)
$(eval $(d)order += $(d)classes/Map.js)
$(eval $(d)order += $(d)classes/EventEmitter.js)
$(eval $(d)order += $(d)classes/Wire.js)
$(eval $(d)order += $(d)classes/WireConstraint.js)
$(eval $(d)order += $(d)classes/BlackBox.js)

$(call helpdoc,$(d)live-blocks.js,LiveBlocks for browser)
$(d)live-blocks.js: $(wildcard $(d)classes/*) $(addprefix $(d)iife/,$(addsuffix .js,header footer))
	cat $(d)iife/header.js $($(d)order) $(d)iife/footer.js > $(d)live-blocks.js

$(call helpdoc,$(d)live-blocks-test.js,LiveBlocks for testing)
$(d)live-blocks-test.js: $(wildcard $(d)classes/*) $(addprefix $(d)iife/test-,$(addsuffix .js,header footer))
	cat $(d)iife/test-header.js $($(d)order) $(d)iife/test-footer.js > $(d)live-blocks-test.js

.PHONY: $(d)all
$(call helpdoc,$(d)all)
$(d)all: $(d)live-blocks.js

.PHONY: $(d)test
$(call helpdoc,$(d)test,Start Karma test runner)
$(d)test: $(d)karma $(d)live-blocks-test.js
	$(if $(d),(cd $(d) && ./karma start),./karma start)

$(d)karma: $(d)node_modules/karma/bin/karma
	ln -sf node_modules/karma/bin/karma $(d)karma

$(d)node_modules/karma/bin/karma:
	$(if $(d),(cd $(d) && npm install),npm install)

.PHONY: $(d)test-deps
$(call helpdoc,$(d)test-deps,Run "make watch WATCHLIST=test-deps > /dev/null" in the background while Karma is running)
$(d)test-deps: $(d)karma $(d)live-blocks-test.js

$(eval $(d)order :=)

.DEFAULT_GOAL := help

endef

$(eval $($(d)template))
$(eval $(d)template :=)

