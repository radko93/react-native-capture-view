#import "CaptureModule.h"
#import "CaptureHelpers.h"
#import <UIKit/UIKit.h>

static NSMutableDictionary<NSString *, NSDictionary *> *sPendingCaptures;

@implementation CaptureModule

+ (void)initialize
{
    if (self == [CaptureModule class]) {
        sPendingCaptures = [NSMutableDictionary new];
    }
}

RCT_EXPORT_MODULE(NativeCaptureModule)

#pragma mark - waitForCapture

- (void)waitForCapture:(NSString *)callbackId
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
    @synchronized(sPendingCaptures) {
        sPendingCaptures[callbackId] = @{
            @"resolve": [resolve copy],
            @"reject": [reject copy],
        };
    }
}

+ (void)resolveCapture:(NSString *)callbackId result:(NSDictionary *)result
{
    RCTPromiseResolveBlock resolve;
    @synchronized(sPendingCaptures) {
        resolve = sPendingCaptures[callbackId][@"resolve"];
        [sPendingCaptures removeObjectForKey:callbackId];
    }
    if (resolve) {
        resolve(result);
    }
}

+ (void)rejectCapture:(NSString *)callbackId code:(NSString *)code message:(NSString *)message
{
    RCTPromiseRejectBlock reject;
    @synchronized(sPendingCaptures) {
        reject = sPendingCaptures[callbackId][@"reject"];
        [sPendingCaptures removeObjectForKey:callbackId];
    }
    if (reject) {
        reject(code, message, nil);
    }
}

#pragma mark - captureScreen

- (void)captureScreen:(JS::NativeCaptureModule::SpecCaptureScreenOptions &)options
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject
{
    NSString *format = options.format();
    double quality = options.quality();
    NSString *resultType = options.result();

    if (!format) format = @"png";
    if (!resultType) resultType = @"tmpfile";

    dispatch_async(dispatch_get_main_queue(), ^{
        UIWindow *window = nil;
        for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
            if ([scene isKindOfClass:[UIWindowScene class]]) {
                UIWindowScene *windowScene = (UIWindowScene *)scene;
                for (UIWindow *w in windowScene.windows) {
                    if (w.isKeyWindow) {
                        window = w;
                        break;
                    }
                }
                if (!window) {
                    window = windowScene.windows.firstObject;
                }
                break;
            }
        }

        if (!window) {
            reject(@"E_NO_WINDOW", @"Could not find key window", nil);
            return;
        }

        CGSize size = window.bounds.size;

        UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc]
            initWithSize:size];

        UIImage *image = [renderer imageWithActions:^(UIGraphicsImageRendererContext *ctx) {
            [window drawViewHierarchyInRect:window.bounds afterScreenUpdates:YES];
        }];

        if (!image) {
            reject(@"E_CAPTURE_FAILED", @"Screen capture failed", nil);
            return;
        }

        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
            NSData *data;
            if ([format isEqualToString:@"jpg"]) {
                data = UIImageJPEGRepresentation(image, quality);
            } else {
                data = UIImagePNGRepresentation(image);
            }

            if (!data) {
                reject(@"E_ENCODE_FAILED", @"Image encoding failed", nil);
                return;
            }

            NSMutableDictionary *resultDict = [@{
                @"width": @(size.width),
                @"height": @(size.height),
                @"format": format,
            } mutableCopy];

            if ([resultType isEqualToString:@"base64"]) {
                resultDict[@"base64"] = [data base64EncodedStringWithOptions:0];
            } else {
                NSError *error = nil;
                NSString *path = [CaptureHelpers writeTempFile:data extension:format error:&error];
                if (!path) {
                    reject(@"E_FILE_WRITE", error.localizedDescription ?: @"Could not write temp file", error);
                    return;
                }
                resultDict[@"uri"] = [NSString stringWithFormat:@"file://%@", path];
            }

            resolve(resultDict);
        });
    });
}

#pragma mark - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeCaptureModuleSpecJSI>(params);
}

@end
