import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { Request, Response } from 'express'

interface RequestWithUser extends Request {
  user?: { userId?: string }
}

/**
 * ValidationPipe puts the per-field messages in the response body and leaves `.message` as
 * the generic "Bad Request Exception". Reading only `.message` threw those away, so a user
 * typing a short password got "Bad Request Exception" instead of being told what was wrong.
 */
function extractMessage(exception: unknown): string | string[] {
  if (!(exception instanceof HttpException)) return 'Internal server error'

  const response = exception.getResponse()
  if (typeof response === 'string') return response

  const detail = (response as { message?: unknown }).message
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.every((item) => typeof item === 'string')) return detail

  return exception.message
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<RequestWithUser>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const message = extractMessage(exception)

    // 5xx means the server broke and nobody would otherwise know: log it with enough
    // context to locate the request. 4xx is the client being told "no" and is not an
    // incident, so it stays out of the log to keep real failures visible.
    //
    // Deliberately never logged: the request body and the Authorization header — both
    // carry credentials that would then live in the deployment's log retention.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const who = request.user?.userId ?? 'anonymous'
      const stack = exception instanceof Error ? exception.stack : String(exception)
      this.logger.error(`${request.method} ${request.url} → ${status} (user: ${who})`, stack)
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    })
  }
}
