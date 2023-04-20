<template>
  <div class="page">
    <div class="header">
      <div class="title">
        {{ $tr('title_sp_set') }}
      </div>
      <div class="desc">
        {{ $tr('b_basic_set_desc') }}
      </div>
    </div>
    <bn-tabs ref="tabs" :value="tab" @tab-click="handleClick">
      <bn-tab-pane :label="$tr('m_bic_settings')" name="sp" />
      <bn-tab-pane :label="$tr('m_pri_settings')" name="privacy" />
      <bn-tab-pane name="chat">
        <span id="bic-setings-tab-chat" slot="label">{{ $tr('m_chat_set') }}</span>
      </bn-tab-pane>
      <bn-tab-pane :label="$tr('m_notif_settings')" name="notification" />
      <bn-tab-pane v-if="showSipTab" name="sip">
        <span id="bic-setings-tab-sip" slot="label">{{ $tr('m_sip_set') }}</span>
      </bn-tab-pane>
    </bn-tabs>
    <router-view :can-edit-setting="canEditSetting" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { app } from 'framework'

const onrnpStorageKey = 'basicSettingsskp'

@Component
export default class Index extends Vue {
  private current = 0
  private showskp = false

  private get canEditSetting() {
    return this.$acl.data('food_setting_edit_setting')
  }

  private hideskp() {
    this.showskp = false
    app.localStorage.set(onrnpStorageKey, false)
  }

  private handleClick(tab: string) {
    this.$router.push(`/portal/settings/basic/${tab}`)
  }

  private mounted() {
    const show = app.localStorage.get(onrnpStorageKey)
    const showskp = show === null ? true : show
    setTimeout(() => {
      this.showskp = showskp
    }, 1000)
  }

  private beforeDestroy() {
    const mm = app.localStorage.get(onrnpStorageKey)
  }
}
</script>

<script lang="ts">
import { app } from 'framework'
app.push('1')
</script>

<style lang="scss" scoped>
.page {
  background-color: #fff;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.12);
  border-radius: 2px;
  margin-top: 16px;
}
.header {
  padding: 24px 24px 8px;
}
.title {
  font-size: 22px;
  color: $trext-primary;
  font-weight: $bold;
  margin-bottom: 6px;
}
</style>
