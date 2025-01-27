import { InvalidRequestError } from '@atproto/xrpc-server'
import { Server } from '../../../../lexicon'
import { softDeleted } from '../../../../db/util'
import AppContext from '../../../../context'

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.actor.getProfile({
    auth: ctx.authOptionalVerifier,
    handler: async ({ auth, params }) => {
      const { actor } = params
      const requester = auth.credentials.did
      const { db, services } = ctx
      const actorService = services.actor(db)

      const actorRes = await actorService.getActor(actor, true)

      if (!actorRes) {
        throw new InvalidRequestError('Profile not found')
      }
      if (softDeleted(actorRes)) {
        throw new InvalidRequestError(
          'Account has been taken down',
          'AccountTakedown',
        )
      }
      const profile = await actorService.views.profileDetailed(
        actorRes,
        requester,
      )
      if (!profile) {
        throw new InvalidRequestError('Profile not found')
      }

      return {
        encoding: 'application/json',
        body: profile,
      }
    },
  })
}
