#import "CaptureViewView.h"
#import "CaptureModule.h"
#import "CaptureHelpers.h"

#import <React/RCTConversions.h>

#import <react/renderer/components/RNCaptureViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNCaptureViewSpec/Props.h>
#import <react/renderer/components/RNCaptureViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface CaptureViewView () <RCTCaptureViewViewViewProtocol>
@end

@implementation CaptureViewView

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<CaptureViewViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const CaptureViewViewProps>();
        _props = defaultProps;
    }
    return self;
}

#pragma mark - Commands

- (void)capture:(NSString *)callbackId
         format:(NSString *)format
        quality:(NSString *)quality
     resultType:(NSString *)resultType
snapshotContentContainer:(BOOL)snapshotContentContainer
{
    double qualityValue = [quality doubleValue];
    if (quality.length == 0) qualityValue = 1.0;

    [self captureWithCallbackId:callbackId
                         format:format
                        quality:qualityValue
                     resultType:resultType
       snapshotContentContainer:snapshotContentContainer];
}

- (void)captureWithCallbackId:(NSString *)callbackId
                       format:(NSString *)format
                      quality:(double)quality
                   resultType:(NSString *)resultType
     snapshotContentContainer:(BOOL)snapshotContentContainer
{
    UIView *viewToCapture = self;
    CGSize size = self.bounds.size;

    // Handle scroll view content capture
    UIScrollView *scrollView = nil;

    if (snapshotContentContainer) {
        scrollView = [self findScrollView:self];
        if (!scrollView) {
            [CaptureModule rejectCapture:callbackId
                                    code:@"E_NO_SCROLL"
                                 message:@"snapshotContentContainer requires a ScrollView child"];
            return;
        }

        UIView *contentView = [self scrollContentView:scrollView];
        if (!contentView) {
            [CaptureModule rejectCapture:callbackId
                                    code:@"E_NO_SCROLL"
                                 message:@"Could not find ScrollView content view"];
            return;
        }

        size = scrollView.contentSize;
        viewToCapture = contentView;
        [contentView layoutIfNeeded];
    }

    if (size.width <= 0 || size.height <= 0) {
        [CaptureModule rejectCapture:callbackId
                                code:@"E_INVALID_SIZE"
                             message:[NSString stringWithFormat:@"View has zero dimensions (%.0fx%.0f)",
                                      size.width, size.height]];
        return;
    }

    // Memory safety check (~4096x4096 pixels max)
    // UIGraphicsImageRenderer allocates at screen scale, so account for that
    CGFloat scale = [UIScreen mainScreen].scale;
    CGFloat maxPixels = 4096.0 * 4096.0;
    if ((size.width * scale) * (size.height * scale) > maxPixels) {
        [CaptureModule rejectCapture:callbackId
                                code:@"E_BITMAP_TOO_LARGE"
                             message:[NSString stringWithFormat:@"Capture dimensions too large (%.0fx%.0f)",
                                      size.width, size.height]];
        return;
    }

    UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size];

    UIImage *image = [renderer imageWithActions:^(UIGraphicsImageRendererContext *ctx) {
        if (scrollView) {
            UIColor *backgroundColor = viewToCapture.backgroundColor ?: scrollView.backgroundColor ?: self.backgroundColor;
            if (backgroundColor) {
                [backgroundColor setFill];
                UIRectFill(CGRectMake(0, 0, size.width, size.height));
            }

            [viewToCapture.layer renderInContext:ctx.CGContext];
            return;
        }

        [viewToCapture drawViewHierarchyInRect:CGRectMake(0, 0, size.width, size.height)
                            afterScreenUpdates:YES];
    }];

    if (!image) {
        [CaptureModule rejectCapture:callbackId
                                code:@"E_CAPTURE_FAILED"
                             message:@"drawViewHierarchyInRect failed"];
        return;
    }

    // Encode off the main thread
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSData *data;
        if ([format isEqualToString:@"jpg"]) {
            data = UIImageJPEGRepresentation(image, quality);
        } else {
            data = UIImagePNGRepresentation(image);
        }

        if (!data) {
            [CaptureModule rejectCapture:callbackId
                                    code:@"E_ENCODE_FAILED"
                                 message:@"Image encoding failed"];
            return;
        }

        NSMutableDictionary *result = [@{
            @"width": @(size.width),
            @"height": @(size.height),
            @"format": format,
        } mutableCopy];

        if ([resultType isEqualToString:@"base64"]) {
            result[@"base64"] = [data base64EncodedStringWithOptions:0];
        } else {
            NSError *error = nil;
            NSString *path = [CaptureHelpers writeTempFile:data extension:format error:&error];
            if (!path) {
                [CaptureModule rejectCapture:callbackId
                                        code:@"E_FILE_WRITE"
                                     message:error.localizedDescription ?: @"Could not write temp file"];
                return;
            }
            result[@"uri"] = [NSString stringWithFormat:@"file://%@", path];
        }

        [CaptureModule resolveCapture:callbackId result:result];
    });
}

#pragma mark - Native Commands

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args
{
    RCTCaptureViewViewHandleCommand(self, commandName, args);
}

#pragma mark - Helpers

- (UIScrollView *)findScrollView:(UIView *)view
{
    for (UIView *subview in view.subviews) {
        if ([subview isKindOfClass:[UIScrollView class]]) {
            return (UIScrollView *)subview;
        }
        // Recurse one level (Fabric may wrap scroll views)
        UIScrollView *nested = [self findScrollView:subview];
        if (nested) return nested;
    }
    return nil;
}

- (UIView *)scrollContentView:(UIScrollView *)scrollView
{
    for (UIView *subview in scrollView.subviews) {
        if (subview.bounds.size.height > 0 || subview.bounds.size.width > 0) {
            return subview;
        }
    }
    return scrollView.subviews.firstObject;
}

@end

Class<RCTComponentViewProtocol> CaptureViewViewCls(void)
{
    return CaptureViewView.class;
}
