import { loader, app } from 'framework'

loader('user')
app.localStorage.set('store', 'iceman')
