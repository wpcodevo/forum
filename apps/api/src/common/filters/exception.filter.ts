import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter")

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const message = exception instanceof HttpException ? exception.getResponse() : "Internal server error"

    this.logError(exception, request, status, message)

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'object' ? (message as any).message || message : message
    })
  }

  private logError(exception: any, request: Request, status: number, message: any) {
    const errorDetails: any = {
      method: request.method,
      url: request.url,
      status,
      message: typeof message === 'object' ? (message as any).message || message : message,
    }

    if (exception.stack) {
      errorDetails.stack = exception.stack
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status}`,
      JSON.stringify(errorDetails, null, 2)
    )
  }
}