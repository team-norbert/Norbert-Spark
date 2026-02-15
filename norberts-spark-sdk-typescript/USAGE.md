<!-- Start SDK Example Usage [usage] -->

```typescript
import { NorbertsSparkSDK } from 'norberts-spark-sdk'

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env['NORBERTSSPARKSDK_BEARER_AUTH'] ?? '',
})

async function run() {
  const result = await norbertsSparkSDK.health.getHealth()

  console.log(result)
}

run()
```

<!-- End SDK Example Usage [usage] -->
